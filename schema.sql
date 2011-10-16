
DROP TABLE IF EXISTS `snippets`;

CREATE TABLE `snippets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(255) NOT NULL,
  `author` int(11) DEFAULT NULL,
  `date` int(11) NOT NULL,
  `type` varchar(255) NOT NULL,
  `input` text NOT NULL,
  `output` text NOT NULL,
  `version` varchar(255) NOT NULL,
  `views` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY (`ip`),
  KEY (`author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

