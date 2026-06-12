from rest_framework import serializers
from .models import Document, DocumentVersion, Category, ActivityLog
from users.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ["id", "name"]

class DocumentVersionSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    size_display = serializers.SerializerMethodField()

    class Meta:
        model  = DocumentVersion
        fields = [
            "id", "version", "file", "note",
            "size", "size_display", "is_current",
            "uploaded_by", "uploaded_at"
        ]

    def get_size_display(self, obj):
        size = obj.size
        if size < 1024:            return f"{size} B"
        if size < 1024 * 1024:     return f"{size/1024:.1f} KB"
        return f"{size/(1024*1024):.1f} MB"

class DocumentSerializer(serializers.ModelSerializer):
    author       = UserSerializer(read_only=True)
    category     = CategorySerializer(read_only=True)
    category_id  = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False
    )
    versions     = DocumentVersionSerializer(many=True, read_only=True)
    current_version = serializers.SerializerMethodField()
    tags_list    = serializers.SerializerMethodField()

    class Meta:
        model  = Document
        fields = [
            "id", "name", "description", "file_type",
            "category", "category_id", "tags", "tags_list",
            "author", "created_at", "updated_at",
            "versions", "current_version",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]

    def get_current_version(self, obj):
        v = obj.versions.filter(is_current=True).first()
        return DocumentVersionSerializer(v).data if v else None

    def get_tags_list(self, obj):
        return obj.get_tags_list()

class DocumentCreateSerializer(serializers.ModelSerializer):
    file        = serializers.FileField(write_only=True)
    version_note = serializers.CharField(write_only=True, required=False, default="Version initiale")
    category_id  = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", required=False
    )

    class Meta:
        model  = Document
        fields = ["name", "description", "file_type", "category_id", "tags", "file", "version_note"]

    def create(self, validated_data):
        file         = validated_data.pop("file")
        version_note = validated_data.pop("version_note", "Version initiale")
        request      = self.context.get("request")
        user         = request.user if request else None

        document = Document.objects.create(author=user, **validated_data)

        DocumentVersion.objects.create(
            document    = document,
            file        = file,
            version     = "v1",
            note        = version_note,
            size        = file.size,
            uploaded_by = user,
            is_current  = True,
        )
        return document
    from .models import Document, DocumentVersion, Category, ActivityLog

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model  = ActivityLog
        fields = ["id", "action", "doc_name", "document", "user_name", "created_at"]

    def get_user_name(self, obj):
        if not obj.user:
            return "—"
        return obj.user.first_name or obj.user.email.split("@")[0]