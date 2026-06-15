from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import BasePermission
from .models import User
from .serializers import UserSerializer, UserCreateSerializer, UserUpdateSerializer, InvitationSerializer, SetPasswordSerializer
from django.core.mail import send_mail
from django.conf import settings as django_settings
from .models import User, Invitation


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
    

class InviteUserView(APIView):
    permission_classes = [IsAdminOnly]

    def post(self, request):
        email = request.data.get("email")
        role  = request.data.get("role", "lecteur")

        if not email:
            return Response({"error": "Email requis."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Un utilisateur avec cet email existe déjà."}, status=400)

        # Supprime une invitation existante pour cet email
        Invitation.objects.filter(email=email).delete()

        invitation = Invitation.objects.create(
            email      = email,
            role       = role,
            invited_by = request.user,
        )

        # ── Envoi de l'email ──────────────────────────────────────────────
        link = f"{django_settings.FRONTEND_URL}/set-password/{invitation.token}"

        send_mail(
            subject = f"Invitation à rejoindre ArchiFlow",
            message = f"""
Bonjour,

Vous avez été invité(e) à rejoindre ArchiFlow en tant que {role}.

Cliquez sur le lien ci-dessous pour créer votre mot de passe :
{link}

Ce lien expire dans 24 heures.

Cordialement,
L'équipe ArchiFlow
            """,
            from_email    = django_settings.DEFAULT_FROM_EMAIL,
            recipient_list = [email],
        )

        return Response({
            "message": f"Invitation envoyée à {email}.",
            "token":   str(invitation.token),  # utile en dev pour tester
        }, status=201)


class SetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        token    = serializer.validated_data["token"]
        password = serializer.validated_data["password"]

        try:
            invitation = Invitation.objects.get(token=token)
        except Invitation.DoesNotExist:
            return Response({"error": "Invitation invalide."}, status=404)

        if not invitation.is_valid:
            return Response({"error": "Ce lien a expiré ou a déjà été utilisé."}, status=400)

        # Crée l'utilisateur
        user = User.objects.create(
            email      = invitation.email,
            username   = invitation.email,
            role       = invitation.role,
            is_active  = True,
        )
        user.set_password(password)
        user.save()

        # Marque l'invitation comme utilisée
        invitation.is_used = True
        invitation.save()

        return Response({"message": "Compte créé avec succès. Vous pouvez maintenant vous connecter."})


class ValidateTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            invitation = Invitation.objects.get(token=token)
            if not invitation.is_valid:
                return Response({"error": "Ce lien a expiré ou a déjà été utilisé."}, status=400)
            return Response({
                "email": invitation.email,
                "role":  invitation.role,
            })
        except Invitation.DoesNotExist:
            return Response({"error": "Invitation invalide."}, status=404)


class InvitationListView(generics.ListAPIView):
    serializer_class   = InvitationSerializer
    permission_classes = [IsAdminOnly]

    def get_queryset(self):
        return Invitation.objects.all().order_by("-created_at")