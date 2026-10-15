from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    QuickAuthView, CurrentUserView, DashboardMetricsView,
    BranchViewSet, CustomerViewSet, LoanViewSet, CollectionViewSet,
    CashSubmissionViewSet, DiscrepancyViewSet, BankDepositViewSet,
    AuditLogViewSet
)

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'collections', CollectionViewSet, basename='collection')
router.register(r'submissions', CashSubmissionViewSet, basename='submission')
router.register(r'discrepancies', DiscrepancyViewSet, basename='discrepancy')
router.register(r'bank-deposits', BankDepositViewSet, basename='bank-deposit')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('auth/quick/', QuickAuthView.as_view(), name='quick-auth'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),
    path('dashboard/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    path('', include(router.urls)),
]
