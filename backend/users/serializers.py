from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["id", "email", "first_name", "last_name", "role", "is_active", "date_joined"]
        read_only_fields = ["date_joined"]

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model  = User
        fields = ["email", "username", "first_name", "last_name", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user     = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ["first_name", "last_name", "role", "is_active"]