# Generated manually: add can_manage_access to DocumentAccess
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_documentaccess'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentaccess',
            name='can_manage_access',
            field=models.BooleanField(default=False),
        ),
    ]
