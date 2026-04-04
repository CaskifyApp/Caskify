package config

import (
	"github.com/spf13/viper"
)

var cfg *viper.Viper

func Init() error {
	cfg = viper.New()
	cfg.SetConfigName("settings")
	cfg.SetConfigType("json")
	cfg.AddConfigPath("$HOME/.config/caskpg")
	cfg.SetDefault("theme", "dark")
	cfg.SetDefault("rowsPerPage", 50)
	return cfg.ReadInConfig()
}

func Get(key string) interface{} {
	return cfg.Get(key)
}

func Set(key string, value interface{}) {
	cfg.Set(key, value)
}
