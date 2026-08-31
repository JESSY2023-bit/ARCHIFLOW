from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from .models import Category, Document, DocumentAccess


class DocumentAccessPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            username="admin",
            password="password123",
            role="admin",
            is_active=True,
        )
        self.author = User.objects.create_user(
            email="author@example.com",
            username="author",
            password="password123",
            role="editeur",
            is_active=True,
        )
        self.reader = User.objects.create_user(
            email="reader@example.com",
            username="reader",
            password="password123",
            role="lecteur",
            is_active=True,
        )
        self.category = Category.objects.create(name="Finance")
        self.document = Document.objects.create(
            name="Budget 2025",
            description="Document interne",
            file_type="PDF",
            category=self.category,
            author=self.author,
            tags="budget,finance",
        )

    def auth_as(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

    def test_reader_without_access_cannot_view_document(self):
        self.auth_as(self.reader)
        url = reverse("document-detail", kwargs={"pk": self.document.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 403)

    def test_reader_with_document_access_can_view_document(self):
        DocumentAccess.objects.create(
            document=self.document,
            user=self.reader,
            can_view=True,
            can_edit=False,
            can_download=False,
            granted_by=self.author,
        )
        self.auth_as(self.reader)
        url = reverse("document-detail", kwargs={"pk": self.document.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["name"], "Budget 2025")

    def test_admin_can_view_all_documents(self):
        self.auth_as(self.admin)
        url = reverse("document-detail", kwargs={"pk": self.document.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["author"]["email"], self.author.email)
