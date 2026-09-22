!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Zada Pharmacy POS Setup"
  !define MUI_WELCOMEPAGE_TEXT "This setup wizard will install Zada Pharmacy POS Cash Counter & Shift Closings Console on your computer.$\r$\n$\r$\n---------------------------------------------------------$\r$\nDeveloped by Zada IT Team:$\r$\n• Humayun Khan$\r$\n• Faizullah$\r$\n---------------------------------------------------------$\r$\n$\r$\nClick Next to continue."
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Installation Complete"
  !define MUI_FINISHPAGE_TEXT "Zada Pharmacy POS Cash Counter & Shift Closings Console has been successfully installed on your computer.$\r$\n$\r$\nDeveloped by Zada IT Team:$\r$\n• Humayun Khan$\r$\n• Faizullah$\r$\n$\r$\nClick Finish to launch the application."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  !define MUI_FINISHPAGE_RUN_TEXT "Run Zada Pharmacy POS"
  !insertmacro MUI_PAGE_FINISH
!macroend
