import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestAuthEndpoints:
    
    def test_register_creates_user(self):
        """Test that registration creates a new user successfully"""
        client = APIClient()
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'TestPass123',
            'password_confirm': 'TestPass123'
        }
        response = client.post('/api/auth/register/', data, format='json')
        
        assert response.status_code == 201
        assert 'refresh' in response.data
        assert 'access' in response.data
        assert User.objects.filter(username='newuser').exists()
    
    def test_register_rejects_duplicate_username(self):
        """Test that registration rejects duplicate username"""
        User.objects.create_user(username='existing', email='existing@example.com', password='TestPass123')
        
        client = APIClient()
        data = {
            'username': 'existing',
            'email': 'another@example.com',
            'password': 'TestPass123',
            'password_confirm': 'TestPass123'
        }
        response = client.post('/api/auth/register/', data, format='json')
        
        assert response.status_code == 400
        assert 'username' in response.data
    
    def test_register_rejects_password_mismatch(self):
        """Test that registration rejects password mismatch"""
        client = APIClient()
        data = {
            'username': 'newuser2',
            'email': 'newuser2@example.com',
            'password': 'TestPass123',
            'password_confirm': 'DifferentPass123'
        }
        response = client.post('/api/auth/register/', data, format='json')
        
        assert response.status_code == 400
    
    def test_login_returns_valid_tokens(self):
        """Test that login returns both access and refresh tokens"""
        User.objects.create_user(username='loginuser', email='login@example.com', password='LoginPass123')
        
        client = APIClient()
        data = {
            'username': 'loginuser',
            'password': 'LoginPass123'
        }
        response = client.post('/api/auth/login/', data, format='json')
        
        assert response.status_code == 200
        assert 'refresh' in response.data
        assert 'access' in response.data
    
    def test_login_rejects_wrong_password(self):
        """Test that login rejects wrong password"""
        User.objects.create_user(username='wrongpass', email='wrong@example.com', password='CorrectPass123')
        
        client = APIClient()
        data = {
            'username': 'wrongpass',
            'password': 'WrongPass123'
        }
        response = client.post('/api/auth/login/', data, format='json')
        
        assert response.status_code == 401
    
    def test_token_refresh_returns_new_access_token(self):
        """Test that token refresh returns a new access token"""
        user = User.objects.create_user(username='refreshuser', email='refresh@example.com', password='RefreshPass123')
        
        client = APIClient()
        # First login to get tokens
        login_data = {
            'username': 'refreshuser',
            'password': 'RefreshPass123'
        }
        login_response = client.post('/api/auth/login/', login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Use refresh token to get new access token
        data = {'refresh': refresh_token}
        response = client.post('/api/auth/token/refresh/', data, format='json')
        
        assert response.status_code == 200
        assert 'access' in response.data
    
    def test_token_refresh_rejects_invalid_token(self):
        """Test that token refresh rejects invalid token"""
        client = APIClient()
        data = {'refresh': 'invalid.token.here'}
        response = client.post('/api/auth/token/refresh/', data, format='json')
        
        assert response.status_code == 401
