import type { Dictionary } from "./en";

// Deutsch: Sie-Form im gemeinsamen Ablauf und in Passagier-Texten, du-Form in
// Pilot-Texten. Siehe docs/BRAND.md § Tone.
const de: Dictionary = {
  home: {
    title: "Hallo Welt",
  },
  notFound: {
    title: "Seite nicht gefunden",
    description: "Die gesuchte Seite gibt es nicht.",
    returnHome: "Zurück zur Startseite",
  },
  forbidden: {
    title: "Kein Schlüssel für diese Tür",
    description: "Angemeldet — aber diese Seite ist nicht freigegeben.",
    returnHome: "Zurück zur Startseite",
  },
  common: {
    back: "Zurück",
    continue: "Fortfahren",
    next: "Weiter",
    skip: "Erst mal überspringen",
    stepProgress: "Schritt {current} von {total}",
    characterLabel: "Animierter Cycling-Without-Age-Begleiter",
    language: "Sprache ändern",
    signOut: "Abmelden",
  },
  welcome: {
    slides: [
      {
        headline: "Jeder hat ein Recht auf Wind in den Haaren.",
        body: "Angefangen hat es 2012 in Kopenhagen, mit einer Rikscha und einer guten Idee.",
      },
      {
        headline: "Die Piloten treten in die Pedale.",
        body: "Ehrenamtliche fahren die Rikscha im Schritttempo. Sie sitzen vorne — nichts zwischen Ihnen und der Straße.",
      },
      {
        headline: "Getragen von Nachbarn.",
        body: "Jede Ortsgruppe lebt von Ehrenamtlichen, die eine Stunde schenken — für die Menschen, die dieses Viertel aufgebaut haben.",
      },
      {
        headline: "Finden Sie Ihre Ortsgruppe.",
        body: "Ortsgruppen in Europa, Nordamerika, Australien und Japan — mit großer Wahrscheinlichkeit auch bei Ihnen.",
      },
    ],
    title: "Kommen Sie mit.",
    subtitle:
      "Melden Sie sich an, um eine Fahrt zu buchen oder selbst in die Pedale zu treten. Oder sehen Sie sich erst einmal um.",
    signIn: "Anmelden",
    explore: "Ohne Anmeldung umsehen",
    carouselLabel: "Was Cycling Without Age ist",
    progressLabel: "Schritt {current} von {total}",
  },
  signIn: {
    identifier: {
      title: "Wie lautet Ihre E-Mail-Adresse oder Telefonnummer?",
      label: "E-Mail-Adresse oder Telefonnummer",
      placeholder: "sie@beispiel.de",
      changeCountry: "Ländervorwahl ändern",
      google: "Weiter mit Google",
      passkey: "Passkey verwenden",
      separator: "oder",
      errors: {
        empty: "Geben Sie eine E-Mail-Adresse oder eine Telefonnummer ein.",
        invalidEmail:
          "Diese E-Mail-Adresse sieht nicht richtig aus. Prüfen Sie sie auf Tippfehler.",
        invalidPhone:
          "Diese Nummer wirkt für {country} unvollständig. Prüfen Sie die Ziffern.",
        rateLimited:
          "Zu viele Versuche. Versuchen Sie es in einer Minute erneut.",
        generic: "Da ist etwas schiefgelaufen. Versuchen Sie es erneut.",
      },
    },
    country: {
      title: "Woher stammt Ihre Telefonnummer?",
      searchLabel: "Nach einem Land suchen",
      searchPlaceholder: "Ländername",
      noResults: "Kein Land passt dazu.",
      selected: "{country}, {dialCode}",
    },
    code: {
      title: "Geben Sie Ihren Code ein",
      sentToEmail:
        "Wir haben einen 6-stelligen Code an {identifier} geschickt.",
      sentToPhone:
        "Wir haben eine SMS mit einem 6-stelligen Code an {identifier} geschickt.",
      label: "6-stelliger Code",
      resend: "Neuen Code senden",
      resendWait: "Gleich können Sie einen neuen Code anfordern.",
      resent: "Neuer Code gesendet.",
      change: "Andere E-Mail-Adresse oder Nummer verwenden",
      errors: {
        invalid:
          "Dieser Code stimmt nicht. Prüfen Sie ihn und versuchen Sie es erneut.",
        expired: "Dieser Code ist abgelaufen. Fordern Sie einen neuen an.",
        rateLimited:
          "Zu viele Versuche. Versuchen Sie es in einer Minute erneut.",
        generic: "Da ist etwas schiefgelaufen. Versuchen Sie es erneut.",
      },
    },
    role: {
      title: "Wie möchten Sie mitmachen?",
      pilot: {
        title: "Ich möchte Pilot werden",
        body: "Du trittst in die Pedale und nimmst Passagiere mit auf eine Fahrt.",
      },
      passenger: {
        title: "Ich möchte Passagier werden",
        body: "Sie sitzen vorne und genießen den Wind in den Haaren.",
      },
    },
  },
  location: {
    title: "Wo möchten Sie fahren?",
    subtitleNearby: "Die Ortsgruppen in Ihrer Nähe.",
    subtitleAll: "Alle Ortsgruppen in alphabetischer Reihenfolge.",
    locating: "Ortsgruppen in Ihrer Nähe werden gesucht …",
    permissionDenied:
      "Ohne Ihren Standort können wir nicht nach Entfernung sortieren — hier sind stattdessen alle Ortsgruppen.",
    searchLabel: "Nach einer Ortsgruppe suchen",
    searchPlaceholder: "Ortsgruppe oder Stadt",
    noResults: "Keine Ortsgruppe passt dazu.",
    distanceAway: "{distance} entfernt",
    mapUnavailable:
      "Die Karte ist gerade nicht verfügbar. Die Liste funktioniert weiterhin.",
    mapLabel: "Karte der Cycling-Without-Age-Ortsgruppen",
    retry: "Meinen Standort verwenden",
    pending: "Einen Moment …",
    next: "Weiter",
    request: "Beitritt anfragen",
    requestCount: "Beitritt zu {count} Ortsgruppen anfragen",
    selectPrompt: "Wählen Sie eine Ortsgruppe, um fortzufahren.",
    titlePassenger: "Wo sollen wir Sie abholen?",
    tabs: {
      careHome: "In einem Pflegeheim",
      home: "Unter meiner eigenen Adresse",
    },
    home: {
      label: "Ihre Adresse",
      placeholder: "Straße und Hausnummer",
      hint: "Tippen Sie los und wählen Sie dann Ihre Adresse aus der Liste.",
      searching: "Wird gesucht …",
      noResults: "Keine Adresse passt dazu.",
      nearest: "Ihre nächste Ortsgruppe",
      duration: "Etwa {duration} mit der Rikscha entfernt",
      confirm: "Das ist meine Adresse",
      outOfRangeTitle: "Wir erreichen Sie noch nicht",
      outOfRangeBody:
        "{chapter} liegt {distance} entfernt — weiter, als die Ortsgruppe fährt ({radius}). Mitfahren können Sie trotzdem: Kommen Sie selbst zur Ortsgruppe oder lassen Sie sich hinbringen, ab der Tür übernimmt ein Pilot.",
      joinAnyway: "Trotzdem {chapter} beitreten",
    },
    errors: {
      unknownChapter:
        "Diese Ortsgruppe gibt es nicht mehr. Wählen Sie eine andere.",
      alreadyPilot: "Du bist bereits Pilot in einer dieser Ortsgruppen.",
      maxChapters:
        "Du kannst höchstens {count} Ortsgruppen auf einmal anfragen.",
      generic: "Wir konnten das nicht speichern. Versuchen Sie es erneut.",
    },
  },
  consent: {
    // Sie-Form: Dieser Schritt ist für Passagiere und Piloten gleich, und die
    // Passagiere sind hier die Mehrheit.
    title: "Drei kurze Zusagen",
    titlePilot: "Zwei kurze Zusagen",
    safety:
      "Mir ist klar, dass die Ausfahrten von geschulten Freiwilligen gefahren werden, und ich halte mich an die Sicherheitsregeln der Ortsgruppe.",
    notifications:
      "Ich möchte E-Mails und Push-Nachrichten zu wichtigen Dingen erhalten.",
    data: "Ich stimme der Speicherung und Verarbeitung meiner Daten zu.",
    imprint: "Impressum",
    privacy: "Datenverarbeitungsvereinbarung",
    dataSuffix: "Siehe {imprint} und {privacy}.",
    required: "Setzen Sie überall ein Häkchen, um fortzufahren.",
    joining: "Sie treten {chapter} bei.",
    setUpBy:
      "{name} hat dieses Konto für Sie eingerichtet. Prüfen Sie die Angaben und stimmen Sie zu, um fortzufahren.",
    error: "Das konnten wir nicht speichern. Versuchen Sie es erneut.",
  },
  profile: {
    title: "Ein wenig über Sie",
    titlePilot: "Ein wenig über dich",
    body: "Ihre Ortsgruppe braucht das, um eine Ausfahrt zu planen. Mehr vorerst nicht.",
    firstName: "Vorname",
    lastName: "Nachname",
    birthDate: "Geburtstag",
    gender: "Geschlecht",
    genders: {
      female: "Weiblich",
      male: "Männlich",
      other: "Divers",
    },
    forSomeoneElse:
      "Ich lege das Konto an, damit jemand anderes mitfahren kann",
    relationship: {
      label: "Ihre Beziehung zu der Person",
      options: {
        child: "Sohn oder Tochter",
        partner: "Partnerin oder Partner",
        relative: "Andere Angehörige",
        carer: "Pflegeperson",
        friend: "Freundin oder Freund",
        other: "Anderes",
      },
    },
    errors: {
      incomplete: "Füllen Sie alle Felder aus, um fortzufahren.",
      birthDate: "Der Geburtstag sieht nicht richtig aus. Prüfen Sie das Jahr.",
      generic: "Das konnten wir nicht speichern. Versuchen Sie es erneut.",
    },
  },
  passkey: {
    title: "Passkey einrichten",
    body: "Ihr Gerät erkennt Sie wieder — kein Passwort zum Merken.",
    create: "Passkey einrichten",
    skip: "Jetzt nicht",
    failed:
      "Das hat nicht geklappt. Sie können einen Passkey später im Konto anlegen.",
    nameLabel: "Passkey benennen (optional)",
    namePlaceholder: "Arbeitslaptop",
    admin: {
      title: "Admins melden sich mit einem Passkey an",
      body: "Dein Gerät wird dein Schlüssel zum Dashboard — Fingerabdruck, Gesicht oder PIN. Leg einen an, um es zu öffnen.",
    },
  },
  pilotNextSteps: {
    // du-Form: Pilot-Texte, siehe docs/BRAND.md § Voice & tone.
    title: "So wirst du Pilot",
    steps: [
      "Schau die Trainingsvideos — rund 20 Minuten, direkt in dieser App.",
      "Komm zu einem praktischen Workshop mit einer der Captains.",
      "Übernimm deine erste Ausfahrt — beim ersten Mal fährt eine Captain mit.",
    ],
    finish: "Weiter",
  },
  join: {
    eyebrow: "Cycling Without Age",
    passenger: {
      title: "Kommen Sie mit auf eine Ausfahrt",
      body: "Eine Freiwillige tritt in die Pedale. Sie sitzen vorne, im Schritttempo, zwischen Ihnen und der Straße nur der Fahrtwind.",
      cta: "Mit dieser Ortsgruppe fahren",
    },
    pilot: {
      title: "In die Pedale treten",
      body: "Piloten nehmen Nachbarn für eine Stunde mit. Fragen Sie an, und ein Admin der Ortsgruppe meldet sich \u2014 meist innerhalb weniger Tage.",
      cta: "Hier als Pilot anfragen",
      pending: "Ihre Anfrage liegt bei der Ortsgruppe.",
    },
    member: {
      title: "Sie gehören schon zu dieser Ortsgruppe",
      cta: "Cycling Without Age öffnen",
    },
    poster: {
      scan: "Scannen und mitmachen",
      or: "oder öffnen Sie",
      slogan: "Recht auf Wind im Haar",
      madeWith: "Buchung von Coding for Change",
    },
    app: {
      title: "Fahren Sie mit der App",
      appStore: "Laden im App Store",
      playStore: "Jetzt bei Google Play",
    },
    ride: {
      cta: "Ausfahrt buchen",
      whenTitle: "Wann passt es Ihnen?",
      when: {
        morning: "vormittags",
        afternoon: "nachmittags",
        any: "jederzeit",
      },
      confirm: "Weiter",
      title: "Fast geschafft",
      summary: "Sie möchten mit {chapter} fahren, {when}.",
      noDraft:
        "Wir haben Ihre Auswahl verloren. Wählen Sie auf der Seite der Ortsgruppe noch einmal eine Zeit.",
      note: "Die Buchung kommt bald \u2014 abgeschickt wurde noch nichts.",
      back: "Zurück zu {chapter}",
    },
  },
  admin: {
    // du-Form: Das Admin-Dashboard richtet sich an Organisatoren und
    // Ehrenamtliche der Ortsgruppen, siehe docs/BRAND.md § Voice & tone.
    nav: {
      overview: "Überblick",
      rides: "Ausfahrten",
      members: "Mitglieder",
      passengers: "Passagiere",
      bikes: "Rikschas",
      chat: "Nachrichten",
      reports: "Berichte",
      chapters: "Ortsgruppen",
      countries: "Länder",
      settings: "Einstellungen",
      help: "Hilfe holen",
    },
    navGroups: {
      main: "Arbeit in der Ortsgruppe",
      organisation: "Organisation",
      footer: "Konto",
    },
    navLabel: "Admin-Bereiche",
    newRide: "Neue Ausfahrt",
    scope: {
      switchLabel: "Perspektive oder Ortsgruppe wechseln",
      label: "Bereich",
      perspective: "Perspektive",
      all: "Alle Ortsgruppen",
      allInCountry: "Alle Ortsgruppen in {country}",
    },
    perspectives: {
      admin: "Admin",
      pilot: "Pilot",
      passenger: "Passagier",
    },
    roles: {
      superadmin: "Superadmin",
      countryAdmin: "Länder-Admin",
      chapterAdmin: "Ortsgruppen-Admin",
      pilot: "Pilot",
      passenger: "Passagier",
    },
    table: {
      search: "Suchen …",
      clearSearch: "Suche löschen",
      columns: "Spalten",
      noResults: "Nichts passt.",
      pageInfo: "{from}–{to} von {total}",
      page: "Seite {page}",
      previous: "Zurück",
      next: "Weiter",
      all: "Alle",
      sortAria: "Nach {column} sortieren",
    },
    user: {
      menuLabel: "Dein Konto",
      account: "Konto",
    },
    commands: {
      open: "Befehlsleiste öffnen",
      hint: "für alles",
      placeholder: "Nach einer Seite oder einer Aktion suchen",
      empty: "Unter dem Namen gibt es nichts.",
      dialogTitle: "Befehlsleiste",
      dialogDescription:
        "Spring zu einer Seite, wechsle die Perspektive oder starte eine Aktion über die Tastatur.",
      newRide: "Neue Ausfahrt starten",
      newChapter: "Neue Ortsgruppe gründen",
      chapterMap: "Ortsgruppen auf der Karte zeigen",
      newCountry: "Neues Land anlegen",
      viewAsAdmin: "Als Admin ansehen",
      viewAsPilot: "Als Pilot ansehen",
      viewAsPassenger: "Als Passagier ansehen",
      toggleSidebar: "Seitenleiste ein- oder ausblenden",
      language: "Sprache: {name}",
      signOut: "Abmelden",
      groups: {
        create: "Erstellen",
        navigate: "Gehe zu",
        perspective: "Perspektive",
        scope: "Bereich",
        account: "Konto",
      },
    },
    pages: {
      overview: {
        title: "Überblick",
        body: "Sobald Ausfahrten gebucht werden, landet hier die kommende Woche — die Fahrten von heute, die Piloten, die sie übernehmen, und alles, was noch auf dich wartet.",
      },
      rides: {
        title: "Ausfahrten",
        body: "Jede Fahrt, die deine Ortsgruppe gebucht hat, von der Anfrage bis zum Winken an der Tür. Noch ist nichts gebucht.",
      },
      members: {
        title: "Mitglieder",
        body: "Piloten, Ortsgruppen-Admins und die Leute, die auf ihre Freigabe warten. Freigeben kannst du sie genau hier.",
      },
      passengers: {
        title: "Passagiere",
        body: "Die Menschen, mit denen deine Ortsgruppe fährt — auch die, für die Angehörige oder Pflegekräfte buchen.",
      },
      bikes: {
        title: "Rikschas",
        body: "Jede Rikscha, um die sich deine Ortsgruppe kümmert, wer sie zuletzt draußen hatte und wann sie wieder zur Wartung muss.",
      },
      chat: {
        title: "Nachrichten",
        body: "Gespräche zwischen Piloten, Passagieren und der Ortsgruppe. Gesagt wurde noch nichts.",
      },
      reports: {
        title: "Berichte",
        body: "Gefahrene Ausfahrten, ehrenamtliche Stunden, zurückgelegte Kilometer — die Zahlen, die eine Ortsgruppe braucht, wenn jemand fragt, was sie eigentlich tut.",
      },
      chapters: {
        title: "Ortsgruppen",
        body: "Die Ortsgruppen, um die du dich kümmerst, und die, die du gründen kannst. Eine Ortsgruppe ist ein Ort, ein Pflegeheim und die Ehrenamtlichen drumherum.",
      },
      countries: {
        title: "Länder",
        body: "Jedes Land der Bewegung und die Admins, die es führen. Das sieht nur ein Superadmin.",
      },
      settings: {
        title: "Einstellungen",
        body: "Wie weit deine Ortsgruppe fährt, wer zu erreichen ist und was auf der eigenen Seite der Ortsgruppe steht.",
      },
      help: {
        title: "Hilfe holen",
        body: "Anleitungen für Ortsgruppen-Admins — und ein Weg zu einem Menschen, wenn eine Anleitung nicht reicht.",
      },
    },
    requests: {
      title: "Warten auf Freigabe",
      body: "Alle hier haben gefragt, ob sie für deine Ortsgruppe pilotieren dürfen. Lies, entscheide — und sie hören noch in derselben Minute von uns.",
      empty: "Es wartet niemand. Wer als Nächstes fragt, landet genau hier.",
      count: "{count} warten",
      columns: {
        person: "Person",
        chapter: "Ortsgruppe",
        applied: "Gefragt",
      },
      review: "Ansehen",
      approve: "Freigeben",
      reject: "Absagen",
      approveTitle: "{name} an Bord holen?",
      approveBody:
        "Die Person bekommt eine E-Mail mit den drei Schritten bis zur ersten Ausfahrt.",
      rejectTitle: "{name} absagen?",
      rejectBody:
        "Die Person bekommt eine E-Mail und kann bei einer anderen Ortsgruppe anfragen.",
      noteLabel: "Eine Nachricht an {name} (optional)",
      notePlaceholder:
        "Ein Trainingstermin, eine Telefonnummer, ein freundliches Wort.",
      approved: "{name} ist an Bord.",
      rejected: "{name} ist informiert.",
    },
    members: {
      title: "Alle in der Ortsgruppe",
      empty:
        "Noch keine Mitglieder. Gib eine Pilotanfrage frei, und der erste Name steht hier.",
      columns: {
        person: "Person",
        role: "Rolle",
        phone: "Telefon",
        joined: "Dabei seit",
      },
      actions: "Aktionen für {name}",
      history: "Verlauf",
      promote: "Zum Ortsgruppen-Admin machen",
      demote: "Adminrechte entziehen",
      remove: "Aus der Ortsgruppe entfernen",
      promoteTitle: "{name} zum Ortsgruppen-Admin machen?",
      promoteBody:
        "Damit kann die Person Piloten freigeben, Ausfahrten buchen und alle Angaben sehen.",
      demoteTitle: "{name} die Adminrechte entziehen?",
      demoteBody:
        "Die Person bleibt in der Ortsgruppe — sie entscheidet nur nicht mehr mit.",
      removeTitle: "{name} aus der Ortsgruppe entfernen?",
      removeBody:
        "Der Zugang zur Ortsgruppe ist damit weg. Gefahrene Ausfahrten bleiben im Protokoll.",
      promoted: "{name} ist Ortsgruppen-Admin.",
      demoted: "{name} ist kein Admin mehr.",
      removed: "{name} ist nicht mehr in der Ortsgruppe.",
      invite: {
        open: "Jemanden einladen",
        title: "Jemanden einladen",
        description:
          "Die Person bekommt eine E-Mail mit einem Link zu {chapter}.",
        name: "Name der Person",
        namePlaceholder: "Anna Schmidt",
        email: "E-Mail-Adresse",
        emailPlaceholder: "anna@beispiel.de",
        role: {
          admin: "Ortsgruppen-Admin",
          pilot: "Pilot",
        },
        roleHint: {
          admin:
            "Leitet die Ortsgruppe, bestätigt neue Piloten und lädt Leute ein.",
          pilot: "Tritt in die Pedale und nimmt Passagiere auf eine Fahrt mit.",
        },
        submit: "Einladung senden",
        sending: "Wird gesendet…",
        cancel: "Abbrechen",
        sent: "Einladung an {name} verschickt.",
        errors: {
          invalid: "Prüf den Namen und die E-Mail-Adresse.",
          generic: "Das hat nicht geklappt. Versuch es noch mal.",
        },
      },
      errors: {
        lastAdmin:
          "Eine Ortsgruppe kann nicht ihren letzten Admin verlieren. Füge zuerst einen weiteren hinzu.",
        alreadyDecided: "Das hat schon jemand entschieden.",
        self: "Deine eigene Rolle kannst du nicht ändern. Bitte eine andere Admin darum.",
        generic: "Das hat nicht geklappt. Versuch es erneut.",
      },
    },
    person: {
      back: "Zurück zu den Mitgliedern",
      roles: "Rollen",
      noRoles: "Noch keine Rolle",
      contact: "Kontakt",
      noEmail: "Keine E-Mail-Adresse",
      noPhone: "Keine Telefonnummer",
      joined: "Dabei seit {date}",
      history: "Verlauf",
      historyEmpty:
        "Noch nichts zu erzählen. Jede Freigabe, jede Rollenänderung und jede E-Mail landet hier.",
      delete: {
        open: "Konto löschen",
        title: "{name} endgültig löschen?",
        body: "Konto, Rollen, Anfragen und Verlauf gehen damit weg. Gefahrene Ausfahrten bleiben im Protokoll.",
        label: "Tipp {word} zur Bestätigung",
        word: "DELETE",
        submit: "Konto löschen",
        done: "{name} ist gelöscht.",
        errors: {
          self: "Dein eigenes Konto kannst du hier nicht löschen.",
          generic: "Das hat nicht geklappt. Versuch es noch mal.",
        },
      },
    },
    history: {
      applicationSubmitted: "{actor} hat gefragt, hier zu pilotieren",
      applicationApproved: "{actor} hat die Anfrage freigegeben",
      applicationRejected: "{actor} hat die Anfrage abgelehnt",
      roleGranted: "{actor} hat eine neue Rolle vergeben",
      roleRevoked: "{actor} hat eine Rolle zurückgenommen",
      memberRemoved: "{actor} hat diese Person aus der Ortsgruppe entfernt",
      emailSent: "Eine E-Mail ist raus — {template}",
      countryAdminAppointed:
        "{actor} hat diese Person zum Länder-Admin gemacht",
      countryAdminRemoved: "{actor} hat diese Person als Länder-Admin abgelöst",
      accountCreated: "{actor} hat dieses Konto angelegt",
      invited: "{actor} hat eine Einladung geschickt",
      accountClaimed: "Diese Person hat das Konto übernommen",
      chapterCreated: "{actor} hat die Ortsgruppe auf die Karte gesetzt",
      chapterUpdated: "{actor} hat {field} geändert",
      chapterDeleted: "{actor} hat die Ortsgruppe {name} gelöscht",
      change: "{from} \u2192 {to}",
      nothing: "nichts",
      you: "Du",
      someone: "Jemand",
      templates: {
        approval: "Freigegeben",
        rejection: "Abgelehnt",
        invite: "Einladung",
      },
      fields: {
        name: "den Namen",
        city: "den Ort",
        location: "den Standort",
        careHomeName: "das Pflegeheim",
        description: "die Beschreibung",
        logo: "das Logo",
        serviceRadiusKm: "die Reichweite",
      },
    },
    chapters: {
      new: "Neue Ortsgruppe",
      edit: "Ortsgruppe bearbeiten",
      empty: "Noch keine Ortsgruppen. Gründe die erste.",
      fields: {
        name: "Name der Ortsgruppe",
        slug: "Webadresse",
        country: "Land",
        city: "Stadt",
        address: "Adresse",
        careHomeName: "Pflegeheim",
        latitude: "Breitengrad",
        longitude: "Längengrad",
        serviceRadiusKm: "Wie weit sie fährt (km)",
        description: "Beschreibung",
        logo: "Webadresse des Logos",
        location: "Standort",
      },
      save: "Ortsgruppe speichern",
      cancel: "Abbrechen",
      created: "{name} steht auf der Karte.",
      saved: "Gespeichert.",
      errors: {
        slugTaken: "Diese Webadresse ist schon belegt. Nimm eine andere.",
        generic: "Das hat nicht geklappt. Versuch es noch mal.",
      },
      views: { list: "Liste", map: "Karte" },
      mapLabel: "Karte der Ortsgruppen",
      mapUnavailable:
        "Für die Karte fehlt ein Mapbox-Token. Setze NEXT_PUBLIC_MAPBOX_TOKEN.",
      open: "Ortsgruppe öffnen",
      create: {
        intro:
          "Ein Name und eine Adresse reichen. Alles andere kann später kommen.",
        address: {
          label: "Adresse finden",
          placeholder: "Straße, Pflegeheim oder Ort",
          hint: "Tipp eine Adresse oder den Namen des Pflegeheims ein.",
          searching: "Suche läuft",
          noResults: "Nichts gefunden. Versuch es mit der Straße oder dem Ort.",
        },
        changeAddress: "Neu suchen",
        dragHint: "Zieh den Pin, um nachzujustieren. Die Adresse folgt.",
        radius: "Wie weit sie fährt",
        radiusValue: "{distance} rund um den Pin",
        overlap: "Überschneidet sich mit {name}, {distance} entfernt.",
        webAddress: "Webadresse",
        slugEdit: "Ändern",
        slugDone: "Fertig",
        slugChecking: "Prüfe",
        slugFree: "Frei",
        slugTaken: "Vergeben",
        countryDetected: "Aus der Adresse erkannt.",
        countryMissing: "{country} ist noch nicht im System.",
        addCountry: "{country} hinzufügen",
        countryAdded: "{country} ist Teil der Bewegung.",
        needCountryAdmin: "Bitte einen Superadmin, zuerst {country} anzulegen.",
        logoPreview: "So wird es aussehen",
        optional: "Optional",
        counter: "{count} / {max}",
        submit: "Ortsgruppe erstellen",
        pending: "Wird erstellt",
        shortcut: "\u2318\u21B5",
        done: {
          title: "{name} steht auf der Karte.",
          body: "Druck das Poster für die Wand im Pflegeheim, oder öffne die Ortsgruppe und füge ihre Leute hinzu.",
          open: "Ortsgruppe öffnen",
          another: "Noch eine gründen",
        },
      },
      detail: {
        back: "Zurück zu den Ortsgruppen",
        location: "Standort",
        about: "Über die Ortsgruppe",
        history: "Verlauf",
        historyEmpty:
          "Noch nichts zu erzählen. Jede Änderung an der Ortsgruppe landet hier.",
        joinLink: "Beitrittslink",
        people: "Menschen",
        members: "Mitglieder",
        passengers: "Fahrgäste",
        pending: "Warten auf Freigabe",
        slug: "Webadresse",
        country: "Land",
        started: "Gegründet am {date}",
        saving: "Speichert",
        saved: "Gespeichert {when}",
        edit: "Bearbeiten",
        undo: "Rückgängig",
        undone: "Zurückgesetzt.",
        invalidUrl: "Das ist keine Webadresse.",
        placeholders: {
          careHome: "Pflegeheim ergänzen",
          description: "Erzähl, worum es in der Ortsgruppe geht",
          logo: "Webadresse eines Logos einfügen",
        },
        radius: "Wie weit sie fährt",
        delete: {
          open: "Ortsgruppe löschen",
          title: "{name} endgültig löschen?",
          body: "Mitglieder, Fahrgäste und offene Anfragen gehen mit. Bereits gefahrene Fahrten bleiben erhalten.",
          footprint:
            "{members} Mitglieder \u00b7 {passengers} Fahrgäste \u00b7 {pending} wartend",
          label: "Tipp {word} zur Bestätigung",
          word: "DELETE",
          submit: "Ortsgruppe löschen",
          done: "{name} ist weg.",
        },
      },
    },
    countries: {
      new: "Neues Land",
      edit: "Land bearbeiten",
      empty: "Noch keine Länder.",
      fields: {
        name: "Name des Landes",
        code: "Ländercode",
      },
      admins: "Länder-Admins",
      noAdmins: "Noch kein Admin",
      appoint: "Länder-Admin hinzufügen",
      appointLabel: "E-Mail-Adresse",
      appointBody: "Die Person muss sich einmal angemeldet haben.",
      appointPlaceholder: "name@beispiel.de",
      appointed: "{email} verantwortet jetzt dieses Land.",
      removeAdmin: "{name} entfernen",
      confirmRemoveAdmin: "{name} als Länder-Admin entfernen?",
      pick: {
        label: "Land",
        placeholder: "Land eintippen",
        empty: "Kein Land mit diesem Namen.",
      },
      nameHint:
        "So erscheint es in der Seitenleiste und auf den Seiten der Ortsgruppen.",
      save: "Land speichern",
      cancel: "Abbrechen",
      created: "{name} ist Teil der Bewegung.",
      saved: "Gespeichert.",
      errors: {
        codeTaken: "Dieser Ländercode ist schon belegt.",
        noAccount: "Zu dieser E-Mail-Adresse gibt es noch kein Konto.",
        generic: "Das hat nicht geklappt. Versuch es noch mal.",
      },
    },
    rides: {
      columns: {
        rider: "Fahrgast",
        day: "Tag",
        when: "Zeit",
        status: "Status",
        chapter: "Ortsgruppe",
        asked: "Angefragt",
        contact: "Gebucht von",
      },
      empty:
        "Noch keine Fahrtanfragen. Sobald ein Passagier eine stellt, landet sie hier.",
    },
    passengers: {
      add: {
        open: "Passagier hinzufügen",
        title: "Passagier hinzufügen",
        body: "Für alle, die sich an der Tür anmelden statt am Handy. Das Konto können sie später mit derselben E-Mail oder Nummer selbst übernehmen.",
        contact: "E-Mail oder Telefonnummer",
        helper: "Jemand unterstützt diese Person",
        helperName: "Name der helfenden Person",
        helperRelationship: "Beziehung",
        helperContact: "E-Mail oder Telefonnummer der helfenden Person",
        helperIsAccountHolder:
          "Dieses Konto gehört dann {helper}, die sich um {passenger} kümmert.",
        submit: "Passagier hinzufügen",
        another: "Gleich noch jemanden hinzufügen",
        anotherHint: "Lässt das Formular für die nächste Person offen.",
        added: "{name} steht auf der Liste.",
        errors: {
          exists: "Zu dieser E-Mail oder Nummer gibt es schon ein Konto.",
          invalid: "Prüf die Angaben \u2014 da stimmt etwas nicht.",
          generic: "Das hat nicht geklappt. Versuch es noch mal.",
        },
      },
      columns: {
        name: "Name",
        born: "Geboren",
        joined: "Dabei seit",
        chapter: "Ortsgruppe",
      },
      empty:
        "Noch keine Passagiere. Füg den ersten hinzu, oder warte, bis sich jemand über die Seite der Ortsgruppe meldet.",
      pickChapter:
        "Wähl eine einzelne Ortsgruppe, um ihr einen Passagier hinzuzufügen.",
    },
    settings: {
      pickChapter:
        "Wähl links eine Ortsgruppe, um ihren Beitrittslink zu sehen.",
      joinLink: {
        title: "Beitrittslink",
        body: "Wer diesen Link öffnet, landet auf der Seite deiner Ortsgruppe und kann von dort beitreten. Druck das Plakat für die Wand im Pflegeheim.",
        copy: "Link kopieren",
        copied: "Link kopiert.",
        poster: "Plakat drucken",
        downloadPng: "QR-Code als PNG speichern",
      },
    },
  },
  pilot: {
    // du-Form: Pilot-Texte, siehe docs/BRAND.md § Voice & tone.
    home: {
      title: "Bereit, wenn du es bist",
      yourChapters: "Deine Ortsgruppen",
      training: "Training für die Wartezeit",
      trainingHint:
        "Rund 20 Minuten Video — danach kennst du die Rikscha, bevor du das erste Mal draufsitzt.",
      celebration: {
        title: "Du bist dabei.",
        body: "{chapter} sagt willkommen. Schau die Trainingsvideos und triff dann eine Captain für deine erste Ausfahrt.",
        dismiss: "Alles klar",
      },
      account: "Konto",
    },
    status: {
      pendingTitle: "Deine Anfrage liegt bei {chapter}",
      reviewers: "Gelesen von",
      reviewersNone:
        "Die Ortsgruppe hat noch keinen Admin benannt. Wir stoßen sie an.",
      steps: ["Angefragt", "Wird geprüft", "Willkommen"],
      appliedOn: "Gefragt am {date}",
      pendingHint:
        "Ortsgruppen antworten meist innerhalb weniger Tage. Für dich gibt es nichts zu tun.",
      rejectedTitle: "{chapter} sagt diesmal nein",
      rejectedBody:
        "Das passiert — Rikschas, Captains und Trainingstermine müssen alle zusammenpassen. Eine andere Ortsgruppe in der Nähe hat vielleicht Platz.",
      note: "Ihre Nachricht",
      applyElsewhere: "Andere Ortsgruppe finden",
    },
    training: {
      title: "Training für die Wartezeit",
      body: "Die Videos werden noch gedreht. Sobald sie fertig sind, stehen sie hier — rund 20 Minuten, danach ein Workshop mit einer der Captains.",
      back: "Zurück zur Pilot-Startseite",
    },
  },
  passenger: {
    account: "Konto",
    title: "Startseite für Passagiere",
    browsing: "Sie sehen {chapter}",
    noChapter: "Sie haben noch keine Ortsgruppe gewählt",
    nav: {
      label: "Bereiche für Passagiere",
      home: "Start",
      rides: "Meine Fahrten",
      messages: "Nachrichten",
      profile: "Profil",
    },
    home: {
      greeting: "Guten Tag, {name}",
      greetingGuest: "Recht auf Wind im Haar",
      book: "Fahrt buchen",
      bookHint: "Ehrenamtliche treten in die Pedale. Sie sitzen vorne.",
      bookAria: "Eine Fahrt mit {chapter} buchen",
      profileAria: "Ihr Profil",
      signIn: "Anmelden",
      nextRide: "Ihre nächste Fahrt",
      withChapter: "Mit {chapter}",
      noChapterYet:
        "Sie haben noch keine Ortsgruppe gewählt. Wählen Sie eine — dann sind es bis zur Fahrt nur zwei Fingertipps.",
      findChapter: "Ortsgruppe finden",
      guestBody:
        "Melden Sie sich an, und jemand nimmt Sie im Schritttempo mit — nichts zwischen Ihnen und der Straße.",
    },
    when: {
      morning: "Am Vormittag",
      afternoon: "Am Nachmittag",
      any: "Zu jeder Tageszeit",
    },
    status: {
      requested: "Angefragt",
      confirmed: "Bestätigt",
      declined: "Diesmal nicht",
      cancelled: "Abgesagt",
      completed: "Gefahren",
    },
    book: {
      title: "Fahrt buchen",
      close: "Schließen",
      back: "Zurück",
      next: "Weiter",
      step: "Schritt {current} von {total}",
      dayTitle: "An welchem Tag möchten Sie fahren?",
      dayHint: "Wählen Sie einen Tag in den nächsten vier Wochen.",
      tomorrow: "Morgen",
      whenTitle: "Welche Tageszeit passt Ihnen?",
      whoTitle: "Wer fährt mit?",
      whoHint: "Wählen Sie die Person, die vorne sitzt.",
      confirmTitle: "Stimmt das so?",
      confirmWho: "Fahrgast",
      confirmDay: "Tag",
      confirmWhen: "Zeit",
      confirmChapter: "Ortsgruppe",
      noteLabel: "Sollen wir etwas wissen? (optional)",
      notePlaceholder:
        "Ein Rollator, eine Lieblingsstrecke, jemand kommt mit …",
      submit: "Anfrage senden",
      sending: "Wird gesendet …",
      sent: "Ihre Anfrage liegt bei der Ortsgruppe.",
      pending:
        "Jemand von der Ortsgruppe stimmt Tag und Uhrzeit mit Ihnen ab. Fest ist noch nichts.",
      errors: {
        invalid:
          "An dieser Anfrage ist etwas nicht angekommen. Bitte versuchen Sie es noch einmal.",
        noPassenger:
          "Zu Ihrem Konto gehört noch kein Fahrgast. Ihre Ortsgruppe kann einen anlegen.",
        unknownPassenger:
          "Diesen Fahrgast konnten wir Ihrem Konto nicht zuordnen.",
        notAMember:
          "Ihre Ortsgruppe hat Ihre Mitgliedschaft beendet, deshalb sind hier keine Fahrten mehr buchbar. Melden Sie sich bei ihr, falls Sie das überrascht.",
        outOfRange: "Bitte wählen Sie einen Tag in den nächsten vier Wochen.",
        duplicate: "Für diesen Tag haben Sie bereits eine Fahrt angefragt.",
        tooMany:
          "Das waren viele Anfragen auf einmal. Bitte in ein paar Minuten noch einmal.",
        generic: "Das hat nicht geklappt. Bitte noch einmal versuchen.",
      },
    },
    rides: {
      title: "Meine Fahrten",
      upcoming: "Kommt",
      past: "Früher",
      empty: "Noch keine Fahrten.",
      emptyBody:
        "Wenn Sie eine Fahrt anfragen, wartet sie hier, bis jemand sie bestätigt.",
      book: "Fahrt buchen",
      askedOn: "Angefragt am {date}",
      note: "Ihre Notiz",
      cancel: "Fahrt absagen",
      cancelTitle: "Ihre Fahrt am {date} absagen?",
      cancelBody:
        "Die Ortsgruppe erfährt es sofort, und die Rikscha geht an jemand anderen. Sie können jederzeit neu anfragen.",
      cancelConfirm: "Ja, absagen",
      cancelKeep: "Behalten",
      cancelled: "Ihre Fahrt ist abgesagt.",
      cancelFailed: "Das hat nicht geklappt. Bitte noch einmal versuchen.",
    },
    messages: {
      title: "Nachrichten",
      empty: "Noch keine Nachrichten",
      emptyBody:
        "Bald kann Ihnen Ihre Ortsgruppe hier schreiben — eine Planänderung, ein Gruß von Ihrem Piloten. Bis dahin rufen sie an oder schreiben eine E-Mail.",
    },
    profile: {
      title: "Profil",
      rider: "Fahrgast",
      born: "Geboren",
      chapter: "Ihre Ortsgruppe",
      noChapter: "Noch keine Ortsgruppe",
      contact: "So erreichen wir Sie",
      language: "Sprache",
      account: "Passkeys und Anmeldung",
      accountAction: "Konto öffnen",
      perspective: "Ansicht wechseln",
      viewAsAdmin: "Admin-Ansicht",
      viewAsPilot: "Piloten-Ansicht",
      managed: "Sie buchen für",
      genders: { female: "Frau", male: "Mann", other: "Divers" },
    },
  },
  account: {
    // du-Form: Das Konto teilen sich Admins, Piloten und Passagiere; die
    // Sicherheitstexte richten sich an Aktive.
    title: "Konto",
    passkeys: "Passkeys",
    passkeysBody:
      "Mit einem Passkey meldet dich dein eigenes Gerät an — Fingerabdruck, Gesicht oder PIN. Nichts zu merken, nichts zu tippen.",
    add: "Passkey hinzufügen",
    nameLabel: "Passkey benennen (optional)",
    namePlaceholder: "Arbeitslaptop",
    unnamed: "Passkey",
    thisDevice: "Dieses Gerät",
    synced: "Synchronisiert",
    added: "Passkey hinzugefügt.",
    remove: "Entfernen",
    removeConfirm: "{name} entfernen?",
    removeBody:
      "Zum Anmelden auf diesem Gerät brauchst du dann einen anderen Passkey oder einen Code per E-Mail oder SMS.",
    empty:
      "Noch keine Passkeys. Leg einen an, und dieses Gerät erkennt dich wieder.",
    failed: "Das hat nicht geklappt. Versuch es erneut.",
    signInAgain:
      "Es ist eine Weile her. Melde dich neu an, bevor du einen Passkey anlegst.",
    signInAgainAction: "Neu anmelden",
    back: "Zurück",
  },
  legal: {
    imprint: {
      title: "Impressum",
      body: "Hier stehen die rechtlichen Angaben der Ortsgruppe.",
    },
    privacy: {
      title: "Datenverarbeitungsvereinbarung",
      body: "Hier steht, was wir speichern, warum wir es speichern und wie Sie es löschen lassen.",
    },
    pending:
      "Diese Seite wird noch geschrieben. Fragen Sie bis dahin Ihre Ortsgruppe nach den Einzelheiten.",
  },
};

export default de;
