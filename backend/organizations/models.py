from django.db import models
import uuid

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, default='Odias ERP Global Enterprise')
    code = models.CharField(max_length=50, default='ODIAS-ERP')
    logo_url = models.CharField(max_length=500, blank=True, default='')
    email = models.EmailField(default='contact@odiaserp.com')
    phone = models.CharField(max_length=30, default='+91 1234567890')
    address = models.TextField(default='LaxmiSager, Bhubaneswar, Odisha - 751024')
    city = models.CharField(max_length=100, default='Bhubaneswar')
    state = models.CharField(max_length=100, default='Odisha')
    country = models.CharField(max_length=100, default='India')
    postal_code = models.CharField(max_length=20, default='751024')
    tax_identifier = models.CharField(max_length=50, default='21AAACR1234F1Z5') # GSTIN
    currency = models.CharField(max_length=10, default='INR')
    currency_symbol = models.CharField(max_length=5, default='₹')
    time_zone = models.CharField(max_length=50, default='Asia/Kolkata')
    financial_year_start = models.CharField(max_length=20, default='April 1')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    address = models.TextField(blank=True, default='')
    is_head_office = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='departments')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='departments')
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Designation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='designations')
    title = models.CharField(max_length=150)
    grade = models.CharField(max_length=50, blank=True, default='L1')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.title} - {self.department.name}"
