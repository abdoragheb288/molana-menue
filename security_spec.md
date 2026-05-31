# Security Specification for Moulana Restaurant Ordering System

This document outlines the security requirements, data invariants, and adversarial test cases designed to protect Moulana's Firestore database from unauthorized operations, data leaks, and invalid inputs.

## 1. Data Invariants

1. **Menu Access**:
   - Anyone can view the menu items (`read` access allowed publicly).
   - Only the Admin (`abdoragheb288@gmail.com`) can create, update, or delete menu items.

2. **Order Access**:
   - Customers can create new orders (`create` is allowed for any valid payload with a schema-matching shape).
   - Customers can view individual orders if they possess the document ID (e.g. `get` access with matching ID, no general `list` allowed for customers to protect PII).
   - Admins have full access (`read` and `write`) to all orders to track and update statuses.

3. **Status Limitations**:
   - When updating orders, a customer or delivery driver CANNOT arbitrarily jump to "completed" status.
   - Only the Admin can update an order's status to processing/completed/cancelled.

4. **Temporal Consistency**:
   - `createdAt` must be strictly set to the server-recorded time (`request.time`) during document creation.
   - `updatedAt` must be strictly set to the server-recorded time (`request.time`) during document update.

---

## 2. The "Dirty Dozen" Adversarial Payloads

The following payloads represent malicious attempts to bypass identity, integrity, and pricing structures in the restaurant database:

1. **Unauthenticated Menu Creation**:
   - *Description*: Attempting to insert a menu item as an unauthenticated customer.
   - *Target*: `create /menu/{menuId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

2. **Admin Spoofing on Menu Creation**:
   - *Description*: A logged-in customer attempts to create a menu item.
   - *Target*: `create /menu/{menuId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

3. **Menu Price Hijacking (Update)**:
   - *Description*: A customer attempting to lower a price on a menu item doc.
   - *Target*: `update /menu/{menuId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

4. **Malicious Menu Overwrite (Ghost Fields)**:
   - *Description*: Admin or user attempting to write an unchecked, huge text string as description or add arbitrary fields to bypass strict keys.
   - *Target*: `create /menu/{menuId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

5. **Self-Assigned Order Completion**:
   - *Description*: A customer creating an order that starts with the `completed` status.
   - *Target*: `create /orders/{orderId}`
   - *Expected Outcome*: `PERMISSION_DENIED` (New orders must start as `pending`)

6. **Order Total Amount Spoofing**:
   - *Description*: A customer submits a large array of food items but sets `totalAmount` to `0` or negative.
   - *Target*: `create /orders/{orderId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

7. **PII Collection Harvesting (List Orders)**:
   - *Description*: An unauthenticated user or clean customer triggers a general `getDocs(collection('orders'))` to dump customer info.
   - *Target*: `list /orders`
   - *Expected Outcome*: `PERMISSION_DENIED` (Admins only)

8. **Tampering with Customer Order Type**:
   - *Description*: Modifying an order to switch the type to delivery and reset some other customer's phone number.
   - *Target*: `update /orders/{orderId}`
   - *Expected Outcome*: `PERMISSION_DENIED` (Unless admin)

9. **Backdated/Postdated Creation Timestamps**:
   - *Description*: Submitting client-side custom dates (e.g., `createdAt` set to 1 year ago) during order placement.
   - *Target*: `create /orders/{orderId}`
   - *Expected Outcome*: `PERMISSION_DENIED`

10. **Bypassing Strict Key Sizes (Denial of Wallet)**:
    - *Description*: Submitting a huge 10MB string as customerName to inflate Firestore storage.
    - *Target*: `create /orders/{orderId}`
    - *Expected Outcome*: `PERMISSION_DENIED`

11. **Malicious Invalid Document IDs**:
    - *Description*: Triggering a request targeting a document ID containing special characters or massive length (e.g., `orders/malicious_sql_like_id_$$$`).
    - *Target*: `get /orders/{orderId}`
    - *Expected Outcome*: `PERMISSION_DENIED`

12. **Tampering with Immutable Admin Rules**:
    - *Description*: Attempting to change the `createdAt` timestamp of a menu item or order during active update operations.
    - *Target*: `update /orders/{orderId}`
    - *Expected Outcome*: `PERMISSION_DENIED`
