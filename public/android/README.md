# Android Notification Icons

Esta pasta contém os ícones de notificação para o aplicativo Android da Connect em múltiplas densidades.

## 📁 Estrutura

```
android/
├── drawable-mdpi/
│   └── ic_stat_connect.png (24x24px)
├── drawable-hdpi/
│   └── ic_stat_connect.png (36x36px)
├── drawable-xhdpi/
│   └── ic_stat_connect.png (48x48px)
├── drawable-xxhdpi/
│   └── ic_stat_connect.png (72x72px)
└── drawable-xxxhdpi/
    └── ic_stat_connect.png (96x96px)
```

## 🚀 Como Usar

### Para React Native CLI / Bare Workflow

Copie as pastas `drawable-*` para:
```
android/app/src/main/res/
```

### Para Expo Managed Workflow

Configure no `app.json`:
```json
{
  "expo": {
    "notification": {
      "icon": "./assets/ic_stat_connect.png"
    }
  }
}
```

## 📖 Documentação Completa

Consulte o guia completo em: `react_native_notification_icon_guide.md`
