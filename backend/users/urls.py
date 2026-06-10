from django.urls import path
from .views import UserListCreateView, UserDetailView, MeView, ChangePasswordView

urlpatterns = [
    path("",      UserListCreateView.as_view(), name="user-list"),
    path("<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path("me/",   MeView.as_view(),             name="user-me"),
    path("change-password/",  ChangePasswordView.as_view(), name="change-password"),
]