from rest_framework import permissions

class IsCollectionAgent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role == 'COLLECTION_AGENT' or request.user.role == 'FINANCE_ADMIN' or request.user.is_superuser)
        )

class IsBranchManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role in ['BRANCH_MANAGER', 'FINANCE_ADMIN'] or request.user.is_superuser)
        )

class IsFinanceAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.user.role == 'FINANCE_ADMIN' or request.user.is_superuser)
        )
