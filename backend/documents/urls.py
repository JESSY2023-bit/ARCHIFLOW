from django.urls import path
from .views import (
    CategoryListView,
    DocumentListCreateView,
    DocumentDetailView,
    DocumentVersionCreateView,
    DocumentVersionRestoreView,
    ActivityLogListView,
    CategoryDetailView,
    DocumentAccessListCreateView,
    DocumentAccessDetailView,
)

urlpatterns = [
    path("activity/", ActivityLogListView.as_view(), name="activity-log"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("", DocumentListCreateView.as_view(), name="document-list"),
    path("<int:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path("<int:pk>/permissions/", DocumentAccessListCreateView.as_view(), name="document-access-list-create"),
    path("<int:pk>/permissions/<int:access_id>/", DocumentAccessDetailView.as_view(), name="document-access-detail"),
    path("<int:pk>/versions/", DocumentVersionCreateView.as_view(), name="version-create"),
    path("<int:pk>/versions/<int:version_pk>/restore/", DocumentVersionRestoreView.as_view(), name="version-restore"),
    path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),
]