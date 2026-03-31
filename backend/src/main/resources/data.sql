-- ─────────────────────────────────────────────────────────────
-- IPOS-SA seed data  —  runs after Hibernate creates the schema.
-- Wrapped in DO $$ so it only inserts once (skipped if data exists).
-- ─────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Only seed if the DB is completely empty (first run)
  IF NOT EXISTS (SELECT 1 FROM user_accounts LIMIT 1) THEN

    -- ── Discount plans ───────────────────────────────────────

    -- Plan: Fixed 3% (CityPharmacy)
    INSERT INTO discount_plans (plan_type) VALUES ('FIXED');
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 0.00, NULL, 3.00
      FROM discount_plans WHERE plan_type = 'FIXED' ORDER BY discount_plan_id DESC LIMIT 1;

    -- Plan: Flexible 0/1/2% (Cosymed Ltd)
    INSERT INTO discount_plans (plan_type) VALUES ('FLEXIBLE');
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 0.00, 1000.00, 0.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 1000.00, 2000.00, 1.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 2000.00, NULL, 2.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;

    -- Plan: Flexible 0/1/3% (HelloPharmacy)
    INSERT INTO discount_plans (plan_type) VALUES ('FLEXIBLE');
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 0.00, 1000.00, 0.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 1000.00, 2000.00, 1.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;
    INSERT INTO discount_tiers (discount_plan_id, min_value, max_value, discount_rate)
      SELECT discount_plan_id, 2000.00, NULL, 3.00
      FROM discount_plans ORDER BY discount_plan_id DESC LIMIT 1;

    -- ── Staff accounts ───────────────────────────────────────

    INSERT INTO user_accounts (username, password, account_type, account_status, is_active, phone, email, balance)
    VALUES
      ('Sysdba',     'London_weighting', 'ADMIN',   'NORMAL', true, '000', 'admin@infopharma.co.uk',   0.00),
      ('manager',    'Get_it_done',      'MANAGER', 'NORMAL', true, '000', 'manager@infopharma.co.uk', 0.00),
      ('accountant', 'Count_money',      'MANAGER', 'NORMAL', true, '000', 'acct@infopharma.co.uk',    0.00),
      ('clerk',      'Paperwork',        'MANAGER', 'NORMAL', true, '000', 'clerk@infopharma.co.uk',   0.00),
      ('warehouse1', 'Get_a_beer',       'MANAGER', 'NORMAL', true, '000', 'wh1@infopharma.co.uk',     0.00),
      ('warehouse2', 'Lot_smell',        'MANAGER', 'NORMAL', true, '000', 'wh2@infopharma.co.uk',     0.00),
      ('delivery',   'Too_dark',         'MANAGER', 'NORMAL', true, '000', 'del@infopharma.co.uk',     0.00);

    -- ── Merchant accounts ────────────────────────────────────

    INSERT INTO user_accounts
      (username, password, account_type, account_status, is_active,
       contact_name, company_name, address, phone, email,
       credit_limit, balance, discount_plan_id, payment_due_date)
    SELECT
      'city', 'northampton', 'MERCHANT', 'NORMAL', true,
      'Prof David Rhind', 'CityPharmacy', 'Northampton Square, London EC1V 0HB',
      '0207 040 8000', 'city@citypharmacy.co.uk',
      10000.00, 0.00, discount_plan_id, NULL
    FROM discount_plans WHERE plan_type = 'FIXED' LIMIT 1;

    INSERT INTO user_accounts
      (username, password, account_type, account_status, is_active,
       contact_name, company_name, address, phone, email,
       credit_limit, balance, discount_plan_id, payment_due_date)
    SELECT
      'cosymed', 'bondstreet', 'MERCHANT', 'NORMAL', true,
      'Mr Alex Wright', 'Cosymed Ltd', '25, Bond Street, London WC1V 8LS',
      '0207 321 8001', 'cosymed@cosymed.co.uk',
      5000.00, 0.00, discount_plan_id, NULL
    FROM discount_plans WHERE plan_type = 'FLEXIBLE' ORDER BY discount_plan_id ASC LIMIT 1;

    INSERT INTO user_accounts
      (username, password, account_type, account_status, is_active,
       contact_name, company_name, address, phone, email,
       credit_limit, balance, discount_plan_id, payment_due_date)
    SELECT
      'hello', 'there', 'MERCHANT', 'SUSPENDED', true,
      'Mr Bruno Wright', 'HelloPharmacy', '12, Bond Street, London WC1V 9NS',
      '0207 321 8002', 'hello@hellopharmacy.co.uk',
      5000.00, 1750.00, discount_plan_id, '2026-02-28'
    FROM discount_plans WHERE plan_type = 'FLEXIBLE' ORDER BY discount_plan_id DESC LIMIT 1;

    -- ── Catalogue (Appendix 1) ───────────────────────────────

    INSERT INTO catalogue_items
      (item_id, description, package_type, unit, units_in_pack, package_cost,
       availability, min_stock_level, reorder_buffer_pct)
    VALUES
      ('100 00001', 'Paracetamol',           'box',    'Caps', 20,  0.10,  10285, 300, 10.00),
      ('100 00002', 'Aspirin',               'box',    'Caps', 20,  0.50,  12453, 500, 10.00),
      ('100 00003', 'Analgin',               'box',    'Caps', 10,  1.20,  4115,  200, 10.00),
      ('100 00004', 'Celebrex, caps 100 mg', 'box',    'Caps', 10,  10.00, 3410,  200, 15.00),
      ('100 00005', 'Celebrex, caps 200 mg', 'box',    'Caps', 10,  18.50, 1440,  150, 15.00),
      ('100 00006', 'Retin-A Tretin, 30 g',  'box',    'Caps', 20,  25.00, 2003,  200, 10.00),
      ('100 00007', 'Lipitor TB, 20 mg',     'box',    'Caps', 30,  15.50, 1542,  200, 10.00),
      ('100 00008', 'Claritin CR, 60g',      'box',    'Caps', 20,  19.50, 2540,  200, 10.00),
      ('200 00004', 'Iodine tincture',       'bottle', 'ml',   100, 0.30,  87,    200, 10.00),
      ('200 00005', 'Rhynol',                'bottle', 'ml',   200, 2.50,  1878,  300, 10.00),
      ('300 00001', 'Ospen',                 'box',    'Caps', 20,  10.50, 776,   200, 10.00),
      ('300 00002', 'Amopen',                'box',    'Caps', 30,  15.00, 1230,  300, 10.00),
      ('400 00001', 'Vitamin C',             'box',    'Caps', 30,  1.20,  3218,  300, 10.00),
      ('400 00002', 'Vitamin B12',           'box',    'Caps', 30,  1.30,  2573,  300, 10.00);

    -- ── Historical demo data ──────────────────────────────────
    -- Account IDs depend on IDENTITY sequence: 7 staff → IDs 1-7, then merchants 8-10.

    -- ─── CityPharmacy — Order Jan 2026, DELIVERED, PAID (3% fixed discount) ───
    INSERT INTO orders (order_id, account_id, order_date, total_value, status,
        dispatched_by, dispatch_date, courier, courier_ref, expected_delivery,
        delivery_date, discount_applied, payment_status)
    VALUES ('IP0001', 8, '2026-01-15', 184.30, 'DELIVERED',
        'warehouse1', '2026-01-17', 'DHL', 'DHL7001', '2026-01-21', '2026-01-20',
        5.70, 'PAID');
    INSERT INTO order_items (order_id, item_id, quantity, unit_cost, total_cost) VALUES
        ('IP0001', '100 00001', 200, 0.10,  20.00),
        ('IP0001', '100 00002', 100, 0.50,  50.00),
        ('IP0001', '100 00003', 100, 1.20, 120.00);
    INSERT INTO invoices (invoice_id, order_id, account_id, invoice_date, amount_due)
        VALUES ('100001', 'IP0001', 8, '2026-01-15', 184.30);
    INSERT INTO payments (account_id, invoice_id, payment_date, amount_paid, payment_method, recorded_by)
        VALUES (8, '100001', '2026-01-20', 184.30, 'BANK_TRANSFER', 'accountant');

    -- ─── CityPharmacy — Order Feb 2026, DELIVERED, PAID (3% fixed discount) ───
    INSERT INTO orders (order_id, account_id, order_date, total_value, status,
        dispatched_by, dispatch_date, courier, courier_ref, expected_delivery,
        delivery_date, discount_applied, payment_status)
    VALUES ('IP0002', 8, '2026-02-10', 785.70, 'DELIVERED',
        'warehouse2', '2026-02-12', 'DHL', 'DHL7002', '2026-02-17', '2026-02-15',
        24.30, 'PAID');
    INSERT INTO order_items (order_id, item_id, quantity, unit_cost, total_cost) VALUES
        ('IP0002', '100 00004', 50, 10.00, 500.00),
        ('IP0002', '100 00007', 20, 15.50, 310.00);
    INSERT INTO invoices (invoice_id, order_id, account_id, invoice_date, amount_due)
        VALUES ('100002', 'IP0002', 8, '2026-02-10', 785.70);
    INSERT INTO payments (account_id, invoice_id, payment_date, amount_paid, payment_method, recorded_by)
        VALUES (8, '100002', '2026-02-18', 785.70, 'BANK_TRANSFER', 'accountant');

    -- ─── Cosymed — Order Jan 2026, DELIVERED, PAID (flexible plan, 0% applied) ───
    INSERT INTO orders (order_id, account_id, order_date, total_value, status,
        dispatched_by, dispatch_date, courier, courier_ref, expected_delivery,
        delivery_date, discount_applied, payment_status)
    VALUES ('IP0003', 9, '2026-01-20', 975.00, 'DELIVERED',
        'warehouse1', '2026-01-22', 'Royal Mail', 'RM5001', '2026-01-27', '2026-01-25',
        0.00, 'PAID');
    INSERT INTO order_items (order_id, item_id, quantity, unit_cost, total_cost) VALUES
        ('IP0003', '100 00008', 50, 19.50, 975.00);
    INSERT INTO invoices (invoice_id, order_id, account_id, invoice_date, amount_due)
        VALUES ('100003', 'IP0003', 9, '2026-01-20', 975.00);
    INSERT INTO payments (account_id, invoice_id, payment_date, amount_paid, payment_method, recorded_by)
        VALUES (9, '100003', '2026-02-01', 975.00, 'CHEQUE', 'accountant');

    -- ─── HelloPharmacy — Order Jan 2026, DELIVERED, PENDING (explains SUSPENDED + £1750 balance) ───
    INSERT INTO orders (order_id, account_id, order_date, total_value, status,
        dispatched_by, dispatch_date, courier, courier_ref, expected_delivery,
        delivery_date, discount_applied, payment_status)
    VALUES ('IP0004', 10, '2026-01-29', 1750.00, 'DELIVERED',
        'warehouse2', '2026-01-31', 'DHL', 'DHL7004', '2026-02-05', '2026-02-04',
        0.00, 'PENDING');
    INSERT INTO order_items (order_id, item_id, quantity, unit_cost, total_cost) VALUES
        ('IP0004', '100 00007', 50, 15.50,  775.00),
        ('IP0004', '100 00008', 50, 19.50,  975.00);
    INSERT INTO invoices (invoice_id, order_id, account_id, invoice_date, amount_due)
        VALUES ('100004', 'IP0004', 10, '2026-01-29', 1750.00);
    -- No payment — HelloPharmacy balance = 1750.00, account SUSPENDED

    -- ── PU Commercial Applications ───────────────────────────
    INSERT INTO pu_applications
      (application_id, type, email, submitted_at, status,
       company_name, company_house_reg, director_name, business_type, address)
    VALUES
      ('PU0003', 'commercial', 'pondPharma@example.com', '2026-01-15', 'PENDING',
       'Pond Pharmacy', 'UK10003429CompH', 'Not provided', 'Pharmacy',
       'Chislehurst, 25 High Street, BR7 5BN'),
      ('PU-COM-002', 'commercial', 'meds@rapidhealth.co.uk', '2026-02-01', 'PENDING',
       'Rapid Health Ltd', 'UK20045611CompH', 'Ms Sarah Barnes', 'Online Pharmacy',
       '8 Commerce Park, Bristol BS1 4AB');

    -- ── Stock Deliveries (feeds stock turnover report) ────────
    INSERT INTO stock_deliveries (item_id, quantity_received, delivery_date, recorded_by) VALUES
        ('100 00001', 2000, '2026-01-05', 'warehouse1'),
        ('100 00002',  500, '2026-01-05', 'warehouse1'),
        ('100 00004',  200, '2026-02-03', 'warehouse2'),
        ('200 00004',  300, '2026-01-08', 'warehouse1'),
        ('100 00007',  300, '2026-02-03', 'warehouse2');

  END IF;
END
$$;
