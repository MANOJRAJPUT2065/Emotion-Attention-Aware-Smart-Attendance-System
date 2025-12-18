import google.auth

credentials, project = google.auth.default()
print(f"Authenticated as {credentials.service_account_email}")
print(f"Using project: {project}")
