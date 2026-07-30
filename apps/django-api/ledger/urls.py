from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import register, login

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
