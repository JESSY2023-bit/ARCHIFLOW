from django.urls import path
from .views import (
    UserListCreateView, UserDetailView,
    MeView, ChangePasswordView,
    InviteUserView, SetPasswordView,
    ValidateTokenView, InvitationListView,
)

urlpatterns = [
    path("",                   UserListCreateView.as_view(),  name="user-list"),
    path("<int:pk>/",          UserDetailView.as_view(),      name="user-detail"),
    path("me/",                MeView.as_view(),              name="user-me"),
    path("change-password/",   ChangePasswordView.as_view(),  name="change-password"),
    path("invite/",            InviteUserView.as_view(),      name="invite-user"),
    path("set-password/",      SetPasswordView.as_view(),     name="set-password"),
    path("validate-token/<uuid:token>/", ValidateTokenView.as_view(), name="validate-token"),
    path("invitations/",       InvitationListView.as_view(),  name="invitation-list"),
]