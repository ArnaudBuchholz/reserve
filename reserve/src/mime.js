'use strict'

const mimeTypes = {}

const tokens = 'openxmlformats,application/,octet-stream,presentation,document,office,image/,audio/,video/,text/,font/,oasis,woff,vnd.,xml,zip,x-'.split(',')
let source = 'aac=Haac,abw=BQabiword,arc=BC,avi=IQmsvideo,azw=BNamazon.ebook,bin=BC,bmp=Gbmp,bz=BQbP,bz2=BQbP2,csh=BQcsh,css=Jcss,csv=Jcsv,doc=Bmsword,docx=BNA-FE.wordprocessingml.E,eot=BNms-fontobject,epub=Bepub+P,gif=Ggif,htm=Jhtml,html,ico=GQicon,ics=Jcalendar,jar=Bjava-archive,jpeg=Gjpeg,jpg,js=Bjavascript,json=Bjson,mid=Hmidi,midi,mpeg=Impeg,mpkg=BNapple.installer+O,odp=BNL.openE.D,ods=BNL.openE.spreadsheet,odt=BNL.openE.text,oga=Hogg,ogv=Iogg,ogx=Bogg,otf=Kotf,png=Gpng,pdf=Bpdf,ppt=BNms-powerpoint,pptx=BNA-FE.Dml.D,rar=BQrar-compressed,rtf=Brtf,sh=BQsh,svg=Gsvg+O,swf=BQshockwave-flash,tar=BQtar,text=Jplain,tif=Gtiff,tiff,ts=Btypescript,ttf=Kttf,txt=Jplain,vsd=BNvisio,wasm=Bwasm,wav=HQwav,weba=Hwebm,webm=Iwebm,webp=Gwebp,woff=KM,woff2=KM2,xhtml=Bxhtml+O,xls=BNms-excel,xlsx=BNA-FE.spreadsheetml.sheet,xml=BO,xul=BNmozilla.xul+O,zip=BP,7z=BQ7z-compressed'
tokens.forEach((token, index) => {
  source = source.replace(new RegExp(String.fromCharCode(65 + index), 'g'), token)
})
let lastMimeType
source.split(',').forEach(line => {
  const [type, mimeType] = line.split('=')
  if (mimeType) {
    lastMimeType = mimeType
  }
  mimeTypes[type] = lastMimeType
})

module.exports = mimeTypes
