CREATE TABLE day (
  id INTEGER NOT NULL AUTO_INCREMENT,
  open FLOAT(7, 2) NOT NULL,
  high FLOAT(7, 2) NOT NULL,
  low FLOAT(7, 2) NOT NULL,
  close FLOAT(7, 2) NOT NULL,
  volumn INTEGER UNSIGNED NOT NULL,
  time DATETIME NOT NULL,
  PRIMARY KEY (id)
)
