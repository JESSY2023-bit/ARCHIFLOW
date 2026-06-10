from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer


# ── Permissions personnalisées ─────────────────────────────────────────────
class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"

class IsAdminOrEditeur(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "editeur"]


# ── Vues ───────────────────────────────────────────────────────────────────
class UserListCreateView(generics.ListCreateAPIView):
    queryset           = User.objects.all().order_by("-date_joined")  # ✅ queryset présent
    permission_classes = [IsAdminOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = User.objects.all()  # ✅ queryset présent
    permission_classes = [IsAdminOnly]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UserUpdateSerializer
        return UserSerializer


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response({"error": "Champs requis."}, status=400)

        if not request.user.check_password(old_password):
            return Response({"error": "Mot de passe actuel incorrect."}, status=400)

        if len(new_password) < 6:
            return Response(
                {"error": "Le mot de passe doit faire au moins 6 caractères."},
                status=400
            )

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Mot de passe modifié avec succès."})