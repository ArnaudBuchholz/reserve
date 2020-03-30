sap.ui.define([
  'sap/ui/core/mvc/XMLView'
], function (XMLView) {
  'use strict'

  XMLView.create({ viewName: 'Demo.App' })
    .then(function (view) {
      view.placeAt('content')
    })
})
