CREATE TABLE admin (
	id SERIAL PRIMARY KEY,
	mail VARCHAR(255) NOT NULL UNIQUE,
	password VARCHAR(256) NOT NULL,
	username VARCHAR(256) NOT NULL UNIQUE,
	anonymized_at TIMESTAMP,
	CONSTRAINT mail_format CHECK (
		mail ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
	)
);

CREATE TABLE app_user (
	id SERIAL PRIMARY KEY,
	username VARCHAR(256) NOT NULL UNIQUE,
	password VARCHAR(256) NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
	role VARCHAR(20) NOT NULL DEFAULT 'GENERIC',
	mail VARCHAR(255),
	anonymized_at TIMESTAMP,
	CHECK (status IN ('ACTIVE', 'BLOCKED', 'DISCONTINUED')),
	CHECK (role IN ('GENERIC', 'STAFF', 'GUEST'))
);

CREATE TABLE admin_creates_user (
	id_admin INTEGER NOT NULL,
	id_user INTEGER NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (id_admin, id_user),
	FOREIGN KEY (id_admin) REFERENCES admin(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	FOREIGN KEY (id_user) REFERENCES app_user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE calendar_note (
	id SERIAL PRIMARY KEY,
	description TEXT,
	start_time TIMESTAMP NOT NULL,
	end_time TIMESTAMP NOT NULL,
	id_creator INTEGER NOT NULL,
	FOREIGN KEY (id_creator) REFERENCES app_user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE has (
	id_calendar_note INTEGER NOT NULL,
	id_tutor INTEGER NOT NULL,
	PRIMARY KEY (id_calendar_note, id_tutor),
	FOREIGN KEY (id_calendar_note) REFERENCES calendar_note(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE student (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	surname VARCHAR(255) NOT NULL,
	class VARCHAR(50),
	description TEXT,
	id_user INTEGER,
	status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
	anonymized_at TIMESTAMP,
	FOREIGN KEY (id_user) REFERENCES app_user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	CHECK (status IN ('ACTIVE', 'BLOCKED', 'WARNED'))
);

CREATE TABLE prenotation (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	flag BOOLEAN NOT NULL DEFAULT FALSE,
	start_time TIMESTAMP NOT NULL,
	end_time TIMESTAMP NOT NULL,
	id_student INTEGER NOT NULL,
	id_tutor INTEGER NOT NULL,
	id_creator INTEGER NOT NULL,
	FOREIGN KEY (id_student) REFERENCES student(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_creator) REFERENCES app_user(id)
		ON DELETE CASCADE
);

CREATE TABLE pack (
	id SERIAL PRIMARY KEY,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	hours FLOAT NOT NULL,
	closure DATE,
	id_student INTEGER NOT NULL,
	checked TEXT NOT NULL DEFAULT 'open' CHECK (checked IN ('open','closed')),
	FOREIGN KEY (id_student) REFERENCES student(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE lesson (
	id SERIAL PRIMARY KEY,
	description TEXT,
	start_time TIMESTAMP NOT NULL,
	end_time TIMESTAMP NOT NULL,
	id_tutor INTEGER NOT NULL,
	id_student INTEGER NOT NULL,
	id_pack INTEGER,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_student) REFERENCES student(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_pack) REFERENCES pack(id)
		ON DELETE SET NULL
);

CREATE TABLE test (
	id SERIAL PRIMARY KEY,
	day DATE NOT NULL,
	description TEXT,
	mark FLOAT CHECK (mark BETWEEN 0 AND 10),
	subject VARCHAR(255),
	id_tutor INTEGER NOT NULL,
	id_student INTEGER NOT NULL,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_student) REFERENCES student(id)
		ON DELETE CASCADE
);

CREATE TABLE push_subscription (
	id SERIAL PRIMARY KEY,
	endpoint TEXT NOT NULL UNIQUE,
	p256dh VARCHAR(255) NOT NULL,
	auth VARCHAR(255) NOT NULL,
	user_agent VARCHAR(512),
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	id_user INTEGER NOT NULL,
	FOREIGN KEY (id_user) REFERENCES app_user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE availability(
	id SERIAL PRIMARY KEY,
	week_day SMALLINT NOT NULL CHECK (week_day BETWEEN 1 AND 7),
	start_time TIME(0) NOT NULL,
	end_time TIME(0) NOT NULL,
	id_tutor INTEGER NOT NULL,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	CONSTRAINT availability_end_after_start CHECK (end_time > start_time)
);

CREATE TABLE exception_day(
	id SERIAL PRIMARY KEY,
	day DATE NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('present','absent')),
	start_time TIME(0),
	end_time TIME(0),
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','refused','approved')),
	id_tutor INTEGER NOT NULL,
	id_staff INTEGER,
	
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_staff) REFERENCES app_user(id)
		ON DELETE SET NULL,
	
	CONSTRAINT times_match_type CHECK (
    		(type = 'present' AND start_time IS NOT NULL AND end_time IS NOT NULL) OR
    		(type = 'absent'  AND start_time IS NULL     AND end_time IS NULL)
	),
    	CONSTRAINT end_after_start
        	CHECK (end_time > start_time)
);

CREATE TABLE dashboard_note(
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	creation TIMESTAMP NOT NULL,
	expiration TIMESTAMP NOT NULL,
	id_admin INTEGER NOT NULL,
	FOREIGN KEY (id_admin) REFERENCES admin(id)
		ON DELETE CASCADE
);

CREATE TABLE see_dashboard_note(
	id_dashboard_note INTEGER NOT NULL,
	id_tutor INTEGER NOT NULL,
	FOREIGN KEY (id_dashboard_note) REFERENCES dashboard_note(id)
		ON DELETE CASCADE,
	FOREIGN KEY (id_tutor) REFERENCES app_user(id)
		ON DELETE CASCADE,
	PRIMARY KEY (id_dashboard_note, id_tutor)
);

CREATE TABLE ticket(
	id SERIAL PRIMARY KEY,
	content TEXT NOT NULL,
	creation TIMESTAMP NOT NULL,
	status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','managing','closed')),
	closure TIMESTAMP,
	comment TEXT,
	id_user INTEGER,
	id_admin INTEGER,
	FOREIGN KEY (id_user) REFERENCES app_user(id)
		ON DELETE SET NULL,
	FOREIGN KEY (id_admin) REFERENCES admin(id)
		ON DELETE SET NULL,
		
	CONSTRAINT closure_match_status
        	CHECK ((status = 'closed') = (closure IS NOT NULL)),
    	CONSTRAINT closure_after_creation
        	CHECK (closure >= creation)
);