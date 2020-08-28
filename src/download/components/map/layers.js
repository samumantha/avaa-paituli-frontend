// import $ from 'jquery'
import * as source from 'ol/source'
import * as layer from 'ol/layer'
// import * as ol_format from 'ol/format'
import * as style from 'ol/style'

import datasets from '../../datasets'
import map from './map'
import { URL } from '../../../shared/urls'
import { translate } from '../../../shared/translations'

let dataLayer = null
let indexLayer = null
let flatgeobuf = null

function init() {
  loadIndexLayer()
  loadDataLayer()
}

function loadDataLayer() {
  if (datasets.hasCurrent() && datasets.getCurrent().data_url != null) {
    const dataUrl = datasets.getCurrent().data_url
    if (dataUrl.indexOf('protected') > -1) {
      dataLayer = new layer.Image({
        title: translate('map.datamap'),
        source: new source.ImageWMS({
          url: URL.WMS_PAITULI_BASE,
          params: { LAYERS: dataUrl, VERSION: '1.1.1' },
          serverType: 'geoserver',
        }),
        visible: true,
      })
    } else {
      dataLayer = new layer.Tile({
        title: translate('map.datamap'),
        source: new source.TileWMS({
          url: URL.WMS_PAITULI_BASE_GWC,
          params: { LAYERS: dataUrl, VERSION: '1.1.1' },
          serverType: 'geoserver',
        }),
        visible: true,
      })
    }
    if (map.getMaxResolution() !== null) {
      dataLayer.setMaxResolution(map.getMaxResolution())
    }
  } else {
    dataLayer = null
  }
}

let indexStyleFunction = function (feature) {
  return new style.Style({
    stroke: new style.Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2,
    }),
    text: new style.Text({
      text: feature.get('label'),
      stroke: new style.Stroke({ width: 0.6 }),
    }),
  })
}

function loadIndexLayer() {
  if (datasets.hasCurrent()) {
    const url = URL.WFS_INDEX_MAP_LAYER.replace('!key!', 'data_id').replace(
      '!value!',
      datasets.getCurrent().data_id
    )
    console.log(
      url +
        '&outputFormat=application/flatgeobuf&format_options=callback:loadIndexMapFeatures'
    )

    // const indexSource = new source.Vector({
    //   format: new ol_format.GeoJSON(),
    //   loader: () => {
    //     $.ajax({
    //       jsonpCallback: 'loadIndexMapFeatures',
    //       dataType: 'jsonp',
    //       url:
    //         url +
    //         '&outputFormat=text/javascript&format_options=callback:loadIndexMapFeatures',

    //       success: (response) => {
    //         const features = indexSource.getFormat().readFeatures(response)
    //         indexSource.addFeatures(features)
    //       },
    //     })
    //   },
    // })

    const indexSource = new source.Vector({
      loader: async function () {
        const response = await fetch(
          url +
            '&outputFormat=application/flatgeobuf&format_options=callback:loadIndexMapFeatures'
        )
        for await (let feature of flatgeobuf.deserialize(response.body)) {
          this.addFeature(feature)
        }
      },
    })

    indexLayer = new layer.Vector({
      title: translate('map.indexmap'),
      source: indexSource,
      visible: true,
      style: indexStyleFunction,
    })
  } else {
    indexLayer = null
  }
}

const getDataLayer = () => dataLayer
const getIndexLayer = () => indexLayer

export default {
  init,
  getDataLayer,
  getIndexLayer,
}
