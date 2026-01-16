-- Add code_verifier column to oauth_states for PKCE support (required by VK ID)
ALTER TABLE oauth_states ADD COLUMN code_verifier varchar(255);
