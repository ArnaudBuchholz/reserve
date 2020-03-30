sap.ui.define([
  'sap/ui/core/mvc/Controller',
  'sap/m/MessageToast',
  'sap/ui/VersionInfo',
  'sap/ui/model/json/JSONModel'
], function (Controller, MessageToast, VersionInfo, JSONModel) {
  'use strict'

  return Controller.extend('Demo.App', {
    onInit: function () {
      VersionInfo.load({
        library: 'sap.ui.core'
      })
        .then(function (info) {
          this.getView().setModel(new JSONModel(info), 'sap.ui.core')
        }.bind(this))
    },

    onPress: function () {
      MessageToast.show('Hello World !')
    }
  })
})
