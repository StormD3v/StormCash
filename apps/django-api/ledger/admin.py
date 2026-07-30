from django.contrib import admin
from .models import User, Account, Transaction, LedgerEntry


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'is_active', 'date_joined']
    search_fields = ['username', 'email']
    readonly_fields = ['id', 'date_joined']


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'user', 'demo_currency_code', 'is_active', 'created_at']
    search_fields = ['account_number', 'user__username']
    readonly_fields = ['id', 'created_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['reference_id', 'transaction_type', 'status', 'created_at']
    search_fields = ['reference_id', 'description']
    list_filter = ['transaction_type', 'status', 'created_at']
    readonly_fields = ['id', 'created_at']


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'account', 'transaction', 'entry_type', 'amount', 'created_at']
    search_fields = ['account__account_number', 'transaction__reference_id']
    list_filter = ['entry_type', 'created_at']
    readonly_fields = ['id', 'created_at']
