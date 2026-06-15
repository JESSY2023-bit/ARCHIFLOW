from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN   = "admin",   "Administrateur"
        EDITEUR = "editeur", "Éditeur"
        LECTEUR = "lecteur", "Lecteur"

    email  = models.EmailField(unique=True)
    role   = models.CharField(max_length=10, choices=Role.choices, default=Role.LECTEUR)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
class Invitation(models.Model):
    email      = models.EmailField(unique=True)
    token      = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    role       = models.CharField(max_length=10, choices=User.Role.choices, default=User.Role.LECTEUR)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="invitations"
    )
    is_used    = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired

    def __str__(self):
        return f"Invitation {self.email} — {'valide' if self.is_valid else 'expirée'}"

# Create your models here.
