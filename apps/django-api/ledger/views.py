from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
def register(request):
    logger.info("[DJANGO_AUTH] Register request received")
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        logger.info(f"[DJANGO_AUTH] Registration successful for user: {user.username}")
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)
    logger.error(f"[DJANGO_AUTH] Registration failed - validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    logger.info("[DJANGO_AUTH] Login request received")
    serializer = LoginSerializer(data=request.data)

    if serializer.is_valid():
        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        logger.info(f"[DJANGO_AUTH] Attempting to authenticate user: {username}")

        user = authenticate(username=username, password=password)

        if user:
            refresh = RefreshToken.for_user(user)
            logger.info(f"[DJANGO_AUTH] Login successful for user: {user.username}")
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": UserSerializer(user).data,
            }, status=status.HTTP_200_OK)

        logger.error(f"[DJANGO_AUTH] Authentication failed for user: {username} - invalid credentials")
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    logger.error(f"[DJANGO_AUTH] Login failed - validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TokenRefreshView(BaseTokenRefreshView):
    def post(self, request, *args, **kwargs):
        logger.info("[DJANGO_AUTH] Token refresh request received")
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            logger.info("[DJANGO_AUTH] Token refresh successful")
        else:
            logger.error(f"[DJANGO_AUTH] Token refresh failed with status {response.status_code}")
        
        return response
