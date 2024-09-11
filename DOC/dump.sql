CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela two_factor_auth deve ser criada primeiro, pois users depende dela
CREATE TABLE two_factor_auth (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    validate BOOLEAN DEFAULT FALSE,
    key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validated_at TIMESTAMP
);

CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (LENGTH(name) >= 4),
    email VARCHAR(100) UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    password VARCHAR(255) NOT NULL,
    creation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edition_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmation_code VARCHAR(255) NOT NULL,
    confirmation_code_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_confirmation_email_sent_at TIMESTAMP,
    is_confirmed BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_auth_id UUID,
    CONSTRAINT fk_two_factor_auth FOREIGN KEY (two_factor_auth_id)
        REFERENCES two_factor_auth(id)
        ON DELETE SET NULL
);

CREATE TABLE verification_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('password_reset', '2fa_reset', '2fa_remove', 'email_change', 'email_confirm')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_two_factor_enabled()
RETURNS TRIGGER AS $$
BEGIN
    -- Se two_factor_auth_id for NULL, two_factor_enabled deve ser false
    IF NEW.two_factor_auth_id IS NULL THEN
        NEW.two_factor_enabled = FALSE;
    ELSE
        -- Se houver ID, o valor de two_factor_enabled depende do status de validação
        NEW.two_factor_enabled = COALESCE((SELECT validate FROM two_factor_auth WHERE id = NEW.two_factor_auth_id), FALSE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar edition_time quando name, email, ou password são modificados
CREATE OR REPLACE FUNCTION update_edition_time()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.name IS DISTINCT FROM OLD.name OR
      NEW.email IS DISTINCT FROM OLD.email OR
      NEW.password IS DISTINCT FROM OLD.password THEN
      NEW.edition_time = CURRENT_TIMESTAMP;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar confirmation_code_created_at quando confirmation_code é modificado
CREATE OR REPLACE FUNCTION update_confirmation_code_time()
RETURNS TRIGGER AS $$
BEGIN
   IF NEW.confirmation_code IS DISTINCT FROM OLD.confirmation_code THEN
      NEW.confirmation_code_created_at = CURRENT_TIMESTAMP;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função que atualiza o campo validated_at quando validate muda para TRUE
CREATE OR REPLACE FUNCTION update_validated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Se validate for true, atualiza validated_at com o timestamp atual
    IF NEW.validate = TRUE AND OLD.validate = FALSE THEN
        NEW.validated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_two_factor_enabled_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_two_factor_enabled();

-- Trigger para atualizar edition_time
CREATE TRIGGER update_edition_time_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_edition_time();

-- Trigger para atualizar confirmation_code_created_at
CREATE TRIGGER update_confirmation_code_time_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_confirmation_code_time();

-- Trigger que chama a função update_validated_at antes da atualização da tabela
CREATE TRIGGER trigger_update_validated_at
BEFORE UPDATE ON two_factor_auth
FOR EACH ROW
EXECUTE FUNCTION update_validated_at();