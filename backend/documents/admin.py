from django.contrib import admin
from .models import Document, DocumentVersion, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display  = ("name", "file_type", "category", "author", "created_at")
    list_filter   = ("file_type", "category")
    search_fields = ("name", "tags")

@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    list_display = ("document", "version", "is_current", "uploaded_by", "uploaded_at")

# Register your models here.
