from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ("email", "get_full_name", "role", "is_active")
    list_filter   = ("role", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering      = ("email",)
    fieldsets     = UserAdmin.fieldsets + (
        ("Rôle ArchiFlow", {"fields": ("role", "avatar")}),
    )

# Register your models here.
