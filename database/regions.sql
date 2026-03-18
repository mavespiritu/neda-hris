CREATE DATABASE IF NOT EXISTS `db_neda_sso`;
USE `db_neda_sso`;

CREATE TABLE IF NOT EXISTS `regions` (
  `code` VARCHAR(9) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `regionName` VARCHAR(100) NOT NULL,
  `islandGroupCode` VARCHAR(20) NOT NULL,
  `psgc10DigitCode` VARCHAR(10) NOT NULL,
  PRIMARY KEY (`code`)
);

INSERT INTO `regions` (`code`, `name`, `regionName`, `islandGroupCode`, `psgc10DigitCode`) VALUES
('010000000', 'Ilocos Region', 'Region I', 'luzon', '0100000000'),
('020000000', 'Cagayan Valley', 'Region II', 'luzon', '0200000000'),
('030000000', 'Central Luzon', 'Region III', 'luzon', '0300000000'),
('040000000', 'CALABARZON', 'Region IV-A', 'luzon', '0400000000'),
('170000000', 'MIMAROPA Region', 'MIMAROPA Region', 'luzon', '1700000000'),
('050000000', 'Bicol Region', 'Region V', 'luzon', '0500000000'),
('060000000', 'Western Visayas', 'Region VI', 'visayas', '0600000000'),
('070000000', 'Central Visayas', 'Region VII', 'visayas', '0700000000'),
('080000000', 'Eastern Visayas', 'Region VIII', 'visayas', '0800000000'),
('090000000', 'Zamboanga Peninsula', 'Region IX', 'mindanao', '0900000000'),
('100000000', 'Northern Mindanao', 'Region X', 'mindanao', '1000000000'),
('110000000', 'Davao Region', 'Region XI', 'mindanao', '1100000000'),
('120000000', 'SOCCSKSARGEN', 'Region XII', 'mindanao', '1200000000'),
('130000000', 'NCR', 'National Capital Region', 'luzon', '1300000000'),
('140000000', 'CAR', 'Cordillera Administrative Region', 'luzon', '1400000000'),
('160000000', 'Caraga', 'Region XIII', 'mindanao', '1600000000'),
('150000000', 'BARMM', 'Bangsamoro Autonomous Region in Muslim Mindanao', 'mindanao', '1900000000');
