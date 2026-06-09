from django.urls import path
from .views import (
    CategoryListView,
    DocumentListCreateView, DocumentDetailView,
    DocumentVersionCreateView, DocumentVersionRestoreView,
)

urlpatterns = [
    path("categories/",                              CategoryListView.as_view(),           name="category-list"),
    path("",                                         DocumentListCreateView.as_view(),      name="document-list"),
    path("<int:pk>/",                                DocumentDetailView.as_view(),          name="document-detail"),
    path("<int:pk>/versions/",                       DocumentVersionCreateView.as_view(),   name="version-create"),
    path("<int:pk>/versions/<int:version_pk>/restore/", DocumentVersionRestoreView.as_view(), name="version-restore"),
]