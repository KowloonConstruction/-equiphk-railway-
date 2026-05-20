# EquipHK Backup Repository

Automated daily backups of the EquipHK website.

A rolling **7-day window** is maintained — backups older than 7 days are removed automatically.

Each folder under `backups/` contains:
- `equiphk_code_YYYY-MM-DD.zip` — full source code
- `equiphk_database_YYYY-MM-DD.sql` — database export

Last backup: 2026-05-20
