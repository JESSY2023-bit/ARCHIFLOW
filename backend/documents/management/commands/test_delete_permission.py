from django.core.management.base import BaseCommand
from django.test import Client
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from documents.models import Document, DocumentVersion, DocumentAccess, Category

User = get_user_model()

class Command(BaseCommand):
    help = 'Create test data and attempt to DELETE a DocumentAccess via API to validate endpoint behavior.'

    def handle(self, *args, **options):
        # create admin and normal user
        admin_email = 'test-admin@example.com'
        user_email = 'test-user@example.com'
        admin_username = admin_email
        user_username = user_email
        admin, _ = User.objects.get_or_create(email=admin_email, defaults={'username': admin_username, 'role':'admin', 'is_active':True})
        admin.set_password('pass1234')
        admin.save()
        user, _ = User.objects.get_or_create(email=user_email, defaults={'username': user_username, 'role':'lecteur', 'is_active':True})
        user.set_password('pass1234')
        user.save()

        # create document
        cat, _ = Category.objects.get_or_create(name='__test_cat__')
        doc = Document.objects.create(name='__test_doc__', file_type='PDF', author=admin, category=cat)
        # create version
        DocumentVersion.objects.create(document=doc, file='documents/__dummy', version='v1', size=10, uploaded_by=admin, is_current=True)

        # create access for user
        access = DocumentAccess.objects.create(document=doc, user=user, can_view=True, can_edit=False, can_download=False, granted_by=admin)

        print(f"Created document id={doc.id} access id={access.id}")

        # Use DRF APIClient and force_authenticate to avoid CSRF/session issues
        api_client = APIClient()
        api_client.force_authenticate(user=admin)

        url = f"/api/documents/{doc.id}/permissions/{access.id}/"
        print(f"DELETE {url}")
        # test client uses 'testserver' host by default; pass a valid HTTP_HOST header
        resp = api_client.delete(url, HTTP_HOST='localhost')
        print("status_code:", resp.status_code)
        print("content:", resp.content.decode())

        # ensure the access is deleted (check DB)
        exists = DocumentAccess.objects.filter(id=access.id).exists()
        print("exists after delete:", exists)
