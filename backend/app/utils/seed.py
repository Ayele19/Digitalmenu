from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.admin import Admin
from app.models.category import Category
from app.models.settings import CafeSettings


async def seed_database(db: AsyncSession) -> None:
    """
    Seed the database with an initial admin account, café settings, and
    the full category tree.  This function is idempotent: if any Admin
    row already exists it returns immediately without touching the database.
    """
    # ------------------------------------------------------------------ #
    # Guard: only seed on a completely empty database
    # ------------------------------------------------------------------ #
    count_result = await db.execute(select(func.count()).select_from(Admin))
    admin_count = count_result.scalar_one()
    if admin_count > 0:
        return

    # ------------------------------------------------------------------ #
    # 1. Admin account
    # ------------------------------------------------------------------ #
    admin = Admin(
        username="admin",
        email="admin@habesha.com",
        hashed_password=hash_password("admin123"),
        is_active=True,
    )
    db.add(admin)

    # ------------------------------------------------------------------ #
    # 2. Café settings (singleton row, id=1)
    # ------------------------------------------------------------------ #
    cafe_settings = CafeSettings(
        id=1,
        cafe_name="Habesha Café",
        welcome_message="Welcome! Enjoy our authentic Ethiopian flavors.",
        logo_url=None,
        address=None,
        phone=None,
        is_menu_active=True,
    )
    db.add(cafe_settings)

    # ------------------------------------------------------------------ #
    # 3. Top-level categories
    # ------------------------------------------------------------------ #
    top_level_defs = [
        ("Traditional Ethiopian Food", "traditional-ethiopian-food", "🍲", 1),
        ("Breakfast",                  "breakfast",                  "🌅", 2),
        ("Lunch",                      "lunch",                      "☀️", 3),
        ("Dinner",                     "dinner",                     "🌙", 4),
        ("Snacks",                     "snacks",                     "🍿", 5),
        ("Fast Food",                  "fast-food",                  "🍔", 6),
        ("Other Food",                 "other-food",                 "🍽️", 7),
        ("Hot Drinks",                 "hot-drinks",                 "☕", 8),
        ("Cold Drinks",                "cold-drinks",                "🥤", 9),
    ]

    top_categories: dict[str, Category] = {}
    for name, slug, icon, order in top_level_defs:
        cat = Category(
            name=name,
            slug=slug,
            icon=icon,
            display_order=order,
            parent_id=None,
            is_active=True,
        )
        db.add(cat)
        top_categories[slug] = cat

    # Flush so that top-level categories get their auto-generated UUIDs
    # before we reference them as parent_id for subcategories.
    await db.flush()

    # ------------------------------------------------------------------ #
    # 4. Subcategories under 'Hot Drinks'
    # ------------------------------------------------------------------ #
    hot_drinks_id = top_categories["hot-drinks"].id
    hot_drink_subs = [
        ("Ethiopian Coffee", "ethiopian-coffee", "☕", 1),
        ("Macchiato",        "macchiato",        "☕", 2),
        ("Tea",              "tea",              "🍵", 3),
        ("Hot Chocolate",    "hot-chocolate",    "🍫", 4),
        ("Other Hot Drinks", "other-hot-drinks", "☕", 5),
    ]
    for name, slug, icon, order in hot_drink_subs:
        db.add(Category(
            name=name,
            slug=slug,
            icon=icon,
            display_order=order,
            parent_id=hot_drinks_id,
            is_active=True,
        ))

    # ------------------------------------------------------------------ #
    # 5. Subcategories under 'Cold Drinks'
    # ------------------------------------------------------------------ #
    cold_drinks_id = top_categories["cold-drinks"].id
    cold_drink_subs = [
        ("Soft Drinks",       "soft-drinks",       "🥤", 1),
        ("Fresh Juice",       "fresh-juice",       "🍊", 2),
        ("Water",             "water",             "💧", 3),
        ("Smoothies",         "smoothies",         "🥤", 4),
        ("Other Cold Drinks", "other-cold-drinks", "🥤", 5),
    ]
    for name, slug, icon, order in cold_drink_subs:
        db.add(Category(
            name=name,
            slug=slug,
            icon=icon,
            display_order=order,
            parent_id=cold_drinks_id,
            is_active=True,
        ))

    # ------------------------------------------------------------------ #
    # Commit everything in a single transaction
    # ------------------------------------------------------------------ #
    await db.commit()
