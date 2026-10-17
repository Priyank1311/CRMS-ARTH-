from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # JWT Authentication (standard /api/v1/ prefix and root fallback)
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair_root'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_root'),

    # OpenAPI / Swagger Documentation (all standard aliases)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema-v1'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-v1'),
    path('api/v1/api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-v1-nested'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui-root'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc-v1'),

    # Application APIs (support both /api/v1/... and direct /...)
    path('api/v1/', include('core.urls')),
    path('', include('core.urls')),
]
