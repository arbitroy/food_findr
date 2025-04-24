# Import models to make them available at the package level
from .restaurant import Restaurant
from .review import Review

# Expose models
__all__ = ['Restaurant', 'Review']