package logger

import (
	"os"
	"regexp"

	"github.com/sirupsen/logrus"
)

var log *logrus.Logger

var passwordRegex = regexp.MustCompile(`(password=)[^\s&]+`)
var userInfoRegex = regexp.MustCompile(`(postgres(?:ql)?://[^:\s]+:)[^@\s]+(@)`)
var envPasswordRegex = regexp.MustCompile(`(POSTGRES_PASSWORD=)[^\s]+`)

func Init() {
	log = logrus.New()
	log.SetOutput(os.Stdout)
	log.SetLevel(logrus.InfoLevel)
	log.SetFormatter(&logrus.JSONFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})
}

func GetLogger() *logrus.Logger {
	if log == nil {
		Init()
	}
	return log
}

func SetLevel(level string) {
	lvl, err := logrus.ParseLevel(level)
	if err != nil {
		lvl = logrus.InfoLevel
	}
	log.SetLevel(lvl)
}

func RedactConnectionString(connStr string) string {
	redacted := passwordRegex.ReplaceAllString(connStr, "${1}***")
	redacted = userInfoRegex.ReplaceAllString(redacted, "${1}***${2}")
	redacted = envPasswordRegex.ReplaceAllString(redacted, "${1}***")
	return redacted
}
