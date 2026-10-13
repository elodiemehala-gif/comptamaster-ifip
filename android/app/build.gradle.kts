plugins {
    id("com.android.application")
}

android {
    namespace = "fr.elodie.comptamasterifip"
    compileSdk = 35

    defaultConfig {
        applicationId = "fr.elodie.comptamasterifip"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.1.1"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".corrige"
            versionNameSuffix = "-corrige"
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
