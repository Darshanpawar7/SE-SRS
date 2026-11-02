# Issue #28: Require HTTPS and TLS for cloud traffic

Database Settings already rejects project URLs that are not valid HTTPS URLs and rejects an empty anon key without replacing a previously valid configuration. Automated tests cover HTTP and malformed URLs.

TLS protocol selection is outside the browser application: the browser negotiates with the Supabase endpoint, and frontend JavaScript cannot require or inspect a minimum TLS version. The Supabase/edge deployment must enforce TLS 1.3 or higher for the deployed endpoint before the full acceptance criterion can be certified.

Manual verification:
1. Enter an `http://` URL in Database Settings and confirm it is rejected and the previous configuration remains unchanged.
2. Inspect the active Supabase request in browser developer tools and confirm the negotiated protocol is TLS 1.3.
3. From a TLS-capable client, confirm the endpoint negotiates a TLS 1.3 connection. Also try a TLS 1.2-only connection; it must fail if the endpoint enforces the required minimum.
4. If the deployed endpoint allows TLS 1.2, configure a TLS 1.3 minimum at the hosting/edge layer or place it behind a TLS 1.3-enforcing gateway. The app alone cannot provide this server-side control.

## Validation status

HTTPS-only client URL validation is implemented and tested. The team has no Supabase project URL configured, so no project endpoint was contacted and no TLS negotiation was observed. TLS 1.3 enforcement remains unverified; keep Issue #28 open until a project endpoint exists and the manual checks above pass.
