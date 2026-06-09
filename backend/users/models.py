from django.contrib.auth.models import AbstractUser
from django.db import models

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

# Create your models here.
