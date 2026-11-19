from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Organization, Branch, Department, Designation
from .serializers import OrganizationSerializer, BranchSerializer, DepartmentSerializer, DesignationSerializer

class OrganizationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = Organization.objects.first()
        if not org:
            org = Organization.objects.create(name='Odias ERP Global Enterprise')
        serializer = OrganizationSerializer(org)
        return Response(serializer.data)

    def put(self, request):
        org = Organization.objects.first()
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]
