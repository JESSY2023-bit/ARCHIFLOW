from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"


class Document(models.Model):
    class FileType(models.TextChoices):
        PDF   = "PDF",   "PDF"
        WORD  = "Word",  "Word"
        EXCEL = "Excel", "Excel"
        CSV   = "CSV",   "CSV"
        OTHER = "Other", "Autre"

    name        = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    file_type   = models.CharField(max_length=10, choices=FileType.choices)
    category    = models.ForeignKey(Category, on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name="documents")
    tags        = models.CharField(max_length=500, blank=True,
                                   help_text="Tags séparés par des virgules")
    author      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name="documents")
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def get_tags_list(self):
        return [t.strip() for t in self.tags.split(",") if t.strip()]

    class Meta:
        ordering = ["-created_at"]


class DocumentVersion(models.Model):
    document   = models.ForeignKey(Document, on_delete=models.CASCADE,
                                   related_name="versions")
    file       = models.FileField(upload_to="documents/")
    version    = models.CharField(max_length=20)
    note       = models.CharField(max_length=255, blank=True)
    size       = models.PositiveIntegerField(default=0, help_text="Taille en octets")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                    null=True, related_name="versions")
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_current  = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.document.name} — {self.version}"

    def save(self, *args, **kwargs):
        # Une seule version courante par document
        if self.is_current:
            DocumentVersion.objects.filter(
                document=self.document, is_current=True
            ).update(is_current=False)
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["-uploaded_at"]

# Create your models here.
class ActivityLog(models.Model):
    class Action(models.TextChoices):
        AJOUT      = "Ajout",      "Ajout"
        MODIFIE    = "Modifié",    "Modifié"
        SUPPRIME   = "Supprimé",   "Supprimé"
        TELECHARGE = "Téléchargé", "Téléchargé"
        RESTAURE   = "Restauré",   "Restauré"

    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name="activities"
    )
    action     = models.CharField(max_length=20, choices=Action.choices)
    document   = models.ForeignKey(
        Document, on_delete=models.SET_NULL,
        null=True, related_name="activities"
    )
    doc_name   = models.CharField(max_length=255)  # garde le nom même après suppression
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} — {self.doc_name} par {self.user}"

    class Meta:
        ordering = ["-created_at"]