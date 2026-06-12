from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Document, DocumentVersion, Category, ActivityLog
from .serializers import (
    DocumentSerializer, DocumentCreateSerializer,
    DocumentVersionSerializer, CategorySerializer,
    ActivityLogSerializer,
)

# ── Permissions ────────────────────────────────────────────────────────────
class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsAdminOrEditeur(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "editeur"]

# ── Utilitaire log ─────────────────────────────────────────────────────────
def log_activity(user, action, document=None, doc_name=""):
    ActivityLog.objects.create(
        user     = user,
        action   = action,
        document = document,
        doc_name = doc_name or (document.name if document else ""),
    )

# ── Vues ───────────────────────────────────────────────────────────────────
class CategoryListView(generics.ListCreateAPIView):
    queryset           = Category.objects.all()
    serializer_class   = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ["name", "tags", "description"]
    ordering_fields    = ["name", "created_at", "file_type"]
    ordering           = ["-created_at"]

    def get_queryset(self):  # ✅ get_queryset bien défini
        qs        = Document.objects.select_related("author", "category").prefetch_related("versions")
        file_type = self.request.query_params.get("type")
        author_id = self.request.query_params.get("author")
        if file_type: qs = qs.filter(file_type=file_type)
        if author_id: qs = qs.filter(author_id=author_id)
        return qs

    def get_serializer_class(self):
        if self.request.method == "POST":
            return DocumentCreateSerializer
        return DocumentSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminOrEditeur()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        doc = serializer.save()
        log_activity(self.request.user, "Ajout", doc)


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Document.objects.select_related("author", "category").prefetch_related("versions")
    serializer_class   = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAdminOnly()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        doc = serializer.save()
        log_activity(self.request.user, "Modifié", doc)

    def perform_destroy(self, instance):
        # ✅ Log AVANT suppression pour garder le nom
        log_activity(self.request.user, "Supprimé", doc_name=instance.name)
        instance.delete()


class DocumentVersionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        file     = request.FILES.get("file")
        if not file:
            return Response({"error": "Fichier requis."}, status=400)

        count   = document.versions.count()
        version = f"v{count + 1}"

        v = DocumentVersion.objects.create(
            document    = document,
            file        = file,
            version     = version,
            note        = request.data.get("note", ""),
            size        = file.size,
            uploaded_by = request.user,
            is_current  = True,
        )
        log_activity(request.user, "Modifié", document)
        return Response(DocumentVersionSerializer(v).data, status=201)


class DocumentVersionRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, version_pk):
        document = get_object_or_404(Document, pk=pk)
        version  = get_object_or_404(DocumentVersion, pk=version_pk, document=document)
        document.versions.update(is_current=False)
        version.is_current = True
        version.save()
        log_activity(request.user, "Restauré", document)
        return Response({"message": f"{version.version} restaurée avec succès."})


class ActivityLogListView(generics.ListAPIView):
    serializer_class   = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        limit = self.request.query_params.get("limit", 10)
        return ActivityLog.objects.select_related("user", "document")[:int(limit)]
# Create your views here.
