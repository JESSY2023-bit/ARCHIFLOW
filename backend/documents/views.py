from rest_framework import generics, permissions, status, filters
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from .models import Document, DocumentVersion, Category, ActivityLog, DocumentAccess
from .serializers import (
    DocumentSerializer, DocumentCreateSerializer,
    DocumentVersionSerializer, CategorySerializer,
    ActivityLogSerializer, DocumentAccessSerializer,
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
        user=user,
        action=action,
        document=document,
        doc_name=doc_name or (document.name if document else ""),
    )


def can_user_access_document(user, document, action="view"):
    if not user or not user.is_authenticated:
        return False
    if user.role == "admin":
        return True
    if document.author_id == user.id:
        return True

    access = DocumentAccess.objects.filter(document=document, user=user).first()
    if not access:
        return False

    if action == "view":
        return access.can_view
    if action == "edit":
        return access.can_edit
    if action == "download":
        return access.can_download
    return False


def get_visible_documents_for_user(user):
    if not user or not user.is_authenticated:
        return Document.objects.none()
    if user.role == "admin":
        return Document.objects.select_related("author", "category").prefetch_related("versions")

    allowed_ids = list(
        DocumentAccess.objects.filter(user=user, can_view=True).values_list("document_id", flat=True)
    )
    allowed_ids += list(Document.objects.filter(author=user).values_list("id", flat=True))
    return Document.objects.filter(id__in=allowed_ids).select_related("author", "category").prefetch_related("versions").distinct()

# ── Vues ───────────────────────────────────────────────────────────────────
class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOnly]


class DocumentAccessListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _user_can_manage(self, user, document):
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        if document.author_id == user.id:
            return True
        # user granted explicit manage access
        return DocumentAccess.objects.filter(document=document, user=user, can_manage_access=True).exists()

    def get_queryset(self):
        document = get_object_or_404(Document, pk=self.kwargs["pk"])
        if not self._user_can_manage(self.request.user, document):
            raise PermissionDenied("Vous n’avez pas les droits pour gérer les accès de ce document.")
        return DocumentAccess.objects.filter(document=document).select_related("user", "granted_by")

    def perform_create(self, serializer):
        document = get_object_or_404(Document, pk=self.kwargs["pk"])
        if not self._user_can_manage(self.request.user, document):
            raise PermissionDenied("Vous n’avez pas les droits pour gérer les accès de ce document.")
        serializer.save(document=document, granted_by=self.request.user)


class DocumentAccessDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DocumentAccessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _user_can_manage(self, user, document):
        if not user or not user.is_authenticated:
            return False
        if user.role == "admin":
            return True
        if document.author_id == user.id:
            return True
        return DocumentAccess.objects.filter(document=document, user=user, can_manage_access=True).exists()

    def get_queryset(self):
        document = get_object_or_404(Document, pk=self.kwargs["pk"])
        if not self._user_can_manage(self.request.user, document):
            raise PermissionDenied("Vous n’avez pas les droits pour gérer les accès de ce document.")
        return DocumentAccess.objects.filter(document=document).select_related("user", "granted_by")


class DocumentListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "tags", "description"]
    ordering_fields = ["name", "created_at", "file_type"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = get_visible_documents_for_user(self.request.user)
        file_type = self.request.query_params.get("type")
        author_id = self.request.query_params.get("author")
        category_id = self.request.query_params.get("category")
        if file_type:
            qs = qs.filter(file_type=file_type)
        if author_id:
            qs = qs.filter(author_id=author_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
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
    queryset = Document.objects.select_related("author", "category").prefetch_related("versions", "access_rules")
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = get_object_or_404(self.get_queryset(), pk=self.kwargs["pk"])
        if not can_user_access_document(self.request.user, obj, "view"):
            raise PermissionDenied("Vous n’avez pas accès à ce document.")
        return obj

    def get_queryset(self):
        return get_visible_documents_for_user(self.request.user)

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsAdminOnly()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        doc = serializer.save()
        log_activity(self.request.user, "Modifié", doc)

    def perform_destroy(self, instance):
        log_activity(self.request.user, "Supprimé", doc_name=instance.name)
        instance.delete()


class DocumentVersionCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        document = get_object_or_404(Document, pk=pk)
        if not can_user_access_document(request.user, document, "edit"):
            return Response({"error": "Vous n’avez pas les droits pour modifier ce document."}, status=403)

        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Fichier requis."}, status=400)

        count = document.versions.count()
        version = f"v{count + 1}"

        v = DocumentVersion.objects.create(
            document=document,
            file=file,
            version=version,
            note=request.data.get("note", ""),
            size=file.size,
            uploaded_by=request.user,
            is_current=True,
        )
        log_activity(request.user, "Modifié", document)
        return Response(DocumentVersionSerializer(v).data, status=201)


class DocumentVersionRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, version_pk):
        document = get_object_or_404(Document, pk=pk)
        if not can_user_access_document(request.user, document, "edit"):
            return Response({"error": "Vous n’avez pas les droits pour restaurer une version."}, status=403)

        version = get_object_or_404(DocumentVersion, pk=version_pk, document=document)
        document.versions.update(is_current=False)
        version.is_current = True
        version.save()
        log_activity(request.user, "Restauré", document)
        return Response({"message": f"{version.version} restaurée avec succès."})


class ActivityLogListView(generics.ListAPIView):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        limit = self.request.query_params.get("limit", 10)
        visible_doc_ids = get_visible_documents_for_user(self.request.user).values_list("id", flat=True)
        return ActivityLog.objects.select_related("user", "document").filter(document_id__in=visible_doc_ids)[:int(limit)]
