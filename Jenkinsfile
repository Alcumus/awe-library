pipeline {
  agent {
    label "jenkins-nodejs"
  }
  environment {
    ORG = 'alcumus'
    APP_NAME = 'awe-library'
    CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
    DOCKER_REGISTRY_ORG = 'alcumus'
  }
  stages {
    stage('CI Build and push snapshot') {
      when {
        branch 'PR-*'
      }
      environment {
        PREVIEW_VERSION = "0.0.0-SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER"
        PREVIEW_NAMESPACE = "$APP_NAME-$BRANCH_NAME".toLowerCase()
        HELM_RELEASE = "$PREVIEW_NAMESPACE".toLowerCase()
      }
      steps {
        container('nodejs') {
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          //sh "CI=true DISPLAY=:99 npm test"
          zip zipFile: 'build.zip', archive: false, dir:'./'
          sh "ls -la"
          archiveArtifacts artifacts: 'build.zip', fingerprint: true
        }
      }
    }
    stage('Build Release') {
      when {
        branch 'jx'
      }
      steps {
        container('nodejs') {
          sh "git checkout jx"
          sh "git config --global credential.helper store"
          sh "jx step git credentials"
          // so we can retrieve the version in later steps
          sh "echo \$(jx-release-version) > VERSION"
          sh "jx step tag --version \$(cat VERSION)"
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          zip zipFile: 'build.zip', archive: false, dir:'./'
          sh "ls -la"
          archiveArtifacts artifacts: 'build.zip', fingerprint: true
        }
      }
    }
    // stage('Promote to Environments') {
    //   when {
    //     branch 'jx'
    //   }
    //   steps {
    //     container('nodejs') {
    //       dir('./charts/awe-library') {
    //         sh "jx step changelog --batch-mode --version v\$(cat ../../VERSION)"

    //         // release the helm chart
    //         sh "jx step helm release"

    //         // promote through all 'Auto' promotion Environments
    //         sh "jx promote -b --all-auto --timeout 1h --version \$(cat ../../VERSION)"
    //       }
    //     }
    //   }
    // }
  }
  post {
        always {
          cleanWs()
        }
  }
}
