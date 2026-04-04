package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var log *logrus.Logger

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
