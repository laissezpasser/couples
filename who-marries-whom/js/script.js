var isMobile = innerWidth < 800 || navigator.platform.indexOf("iPhone") != -1
d3.select('body').classed('mobile', isMobile)

var mColor = '#8CCDFF'
var fColor = '#FA8A9C'

d3.selectAll('#linear-mf stop').data([mColor, fColor]).attr('stop-color', ƒ())
d3.selectAll('#linear-fm stop').data([fColor, mColor]).attr('stop-color', ƒ())
d3.selectAll('#circle-fm stop').data([fColor, fColor, mColor, mColor]).attr('stop-color', ƒ())


queue()
.defer(d3.csv, 'job-name.csv')
.defer(d3.csv, 'pair-count.csv')
.awaitAll(function(err, res){
  jobNames = res[0]
  pairs = res[1]

  codeToJob = {}
  jobNames.forEach(function(d){
    d.fTotal = 0
    d.mTotal = 0

    d.sTotal = 0
    d.scTotal = 0

    d.ffTotal = 0
    d.mmTotal = 0

    d.hhMatches = []
    d.spMatches = []

    codeToJob[d.code] = d
  })

  pairs.forEach(function(d){
    d.total = +d.total/100

    var hhJob = codeToJob[d.occ]
    var spJob = codeToJob[d.occ_sp]
    d.hhJob = hhJob
    d.spJob = spJob

    hhJob[d.sex == 1 ? 'mTotal' : 'fTotal'] += d.total

    if (d.occ_sp == '') return

    spJob[d.sex_sp == 1 ? 'mTotal' : 'fTotal'] += d.total
    hhJob.hhMatches.push(d )
    spJob.spMatches.push()

    if (d.occ == d.occ_sp) hhJob.sTotal += d.total

    if (hhJob.category == spJob.category){
      hhJob.scTotal += d.total
      spJob.scTotal += d.total
    }

    if (d.sex == d.sex_sp){
      hhJob[d.sex == '1' ? 'mmTotal' : 'ffTotal'] += d.total
      spJob[d.sex == '1' ? 'mmTotal' : 'ffTotal'] += d.total
    }

    d.hhSexStr = d.sex    == '1' ? 'M' : 'F'
    d.spSexStr = d.sex_sp == '1' ? 'M' : 'F'

    codeToJob[d.occ][d.sex_sp == 1 ? 'mTotal' : 'fTotal'] += d.total
  })

  jobs = d3.values(codeToJob)

  jobs.forEach(function(d){
    d.percentFemale = d.fTotal/(d.mTotal + d.fTotal)

    d.total = d.fTotal + d.mTotal
    d.percentSelf = d.sTotal/d.total

    d.percentSelfC = d.scTotal/d.total
    d.percentMM = d.mmTotal/d.total
    d.percentFF = d.ffTotal/d.total


    d.lcOccupation = d.occupation.toLowerCase()
  })

  var total = d3.sum(jobs, ƒ('total'))
  jobs = jobs.filter(ƒ('total')).filter(function(d){ return d.occupation != 'none' })

  jobs.forEach(function(d){
    d.percentTotal = d.total/total
  })




  if (!isMobile){
    var w = Math.min(innerWidth - 8, 1400)
    var cols = Math.floor((w - 0)/83)
    var rows = Math.ceil(jobs.length/cols)
    var h = rows*25

    jobs = _.sortBy(jobs, function(d){ return d.fTotal*d.fTotal - d.mTotal*d.mTotal })

    jobs.forEach(function(d, i){
      d.row = i % rows
      d.col = Math.floor(i/rows)

      d.pos = [(d.col)*w/cols, d.row*h/rows]
      d.cPos = [d.pos[0] + w/cols/2, d.pos[1] + h/rows/2]

      d.mPos = addPos(d.cPos, [-10, 0])
      d.fPos = addPos(d.cPos, [10, 0])
    })

    var svg = d3.select('#lines').attr({width: w, height: h})
    var div = d3.select('#text-blocks')
    d3.select('#graph').style('height', h + 20 + 'px').style('width', w + 'px')

    var connectionG = svg.append('g.connections')

    var jobSel = div.dataAppend(jobs, 'div.job-text')
        .style({left: function(d){ return d.pos[0] + 'px' }})
        .style({top:  function(d){ return d.pos[1] + 'px' }})
        .each(function(d){ d.sel = d3.select(this) })
        .text(ƒ('soccupation'))


    jobSel.on('mouseover', highlightJob)
  }

  function highlightJob(job){
    d3.selectAll('div.active')
        .style({'margin-top': '0px', 'margin-left': '0px'})
        .classed('active', false)
      .transition().duration(1).delay(300)
        .style('pointer-events', 'all')

    jobs.forEach(function(d){
      d.matchTotal  = 0
      d.matchFFTotal = 0
      d.matchFMTotal = 0
      d.matchMMTotal = 0
      d.matchMFTotal = 0
      d.overlap = false
      d.active = false
    })

    job.hhMatches.forEach(function(d){
      d.spJob.matchTotal += d.total
      d.spJob['match' + d.hhSexStr + d.spSexStr + 'Total'] += d.total
    })

    job.spMatches.forEach(function(d){
      d.hhJob['match' + d.spSexStr + d.hhSexStr + 'Total'] += d.total
    })

    mfLines = _.sortBy(jobs, 'matchMFTotal').reverse().slice(0, 6)
    fmLines = _.sortBy(jobs, 'matchFMTotal').reverse().slice(0, 6)

    var mfC = fmC = minMostCommon = 0
    while(mfC + fmC < 5){
      minMostCommon = Math.max(mfLines[mfC].matchMFTotal, fmLines[fmC].matchFMTotal)
      mfLines[mfC].matchMFTotal > fmLines[fmC].matchFMTotal ? mfC++ : fmC++
    }
    mfLines = mfLines.slice(0, Math.max(mfC, 1))
    fmLines = fmLines.slice(0, Math.max(fmC, 1))

    ffLines = _.sortBy(jobs, 'matchMMTotal').reverse().slice(0, 1)
    mmLines = _.sortBy(jobs, 'matchFFTotal').reverse().slice(0, 1)

    var maxTotal = d3.max([mfLines[0].matchMFTotal, fmLines[0].matchFMTotal, ffLines[0].matchFFTotal, mmLines[0].matchMMTotal])

    mfLines = mfLines.slice(0, Math.max(mfC, 0))
    fmLines = fmLines.slice(0, Math.max(fmC, 0))


    if (isMobile) return highlightMobile(job)

    connectionG.selectAll('path.connection')
        .classed('connection', false)
      .transition().duration(100)
        .style('opacity', .3)
        // .style('stroke-width', 0)
        .remove()

    var divTop = div.node().getBoundingClientRect().top - 92
    var divBot = divTop + innerHeight

    var allHighlights = mfLines.concat(fmLines).concat(job).concat(ffLines).concat(mmLines)
    allHighlights = _.sortBy(allHighlights, 'occupation')

    allHighlights.forEach(function(d){
      d.shift = d.col == 0 ? [60, 0] : d.col == cols -1 ? [-40, 0] : [0, 0]
      d.sel
          .classed('active', true)
        .transition().duration(1).delay(300)
          .style('pointer-events', 'none')

      //push onto screen
      if (d.pos[1] + divTop < 0){
        d.shift[1] = -divTop + 40
      } else if (d.pos[1] + divTop - innerHeight > -100){
        d.shift[1] = -(d.pos[1] + divTop-innerHeight + 200)
      }
    })

    //push off eachother
    function highlightRepel(){
      allHighlights.forEach(function(i){
        allHighlights.forEach(function(j){
          if (i == j) return

          var iPos = addPos(i.pos, i.shift)
          var jPos = addPos(j.pos, j.shift)

          var dif = vecDif(iPos, jPos)
          var absDif = dif.map(Math.abs)
          if (absDif[0] < 100 && absDif[1] < 70){
            i.overlap = true
            j.overlap = true

            var vDif = 70 - absDif[1]
            if (iPos[1] <= jPos[1]){
              i.shift = addPos(i.shift, [0, -vDif/2])
              j.shift = addPos(j.shift, [0,  vDif/2])
            } else {
              i.shift = addPos(i.shift, [0,  vDif/2])
              j.shift = addPos(j.shift, [0, -vDif/2])
            }
          }
        })
      })
    }
    highlightRepel()
    highlightRepel()

    connectionG.dataAppend(mfLines, 'path.connection.mf')
        .filter(function(d){ return d != job })
        .attr('d', function(d){
          return ['M', addPos(job.mPos, job.shift), 'L', addPos(d.fPos, d.shift, -3)].join('')
        })
        .style({stroke: function(d){
          return d.fPos[0] < job.mPos[0] ? 'url(#linear-fm)' : 'url(#linear-mf)' } })
        .style('stroke-width', function(d){ return d.matchMFTotal == maxTotal ? 10 : 3  })

    connectionG.dataAppend(fmLines, 'path.connection.fm')
        .filter(function(d){ return d != job })
        .attr('d', function(d){
          return ['M', addPos(job.fPos, job.shift), 'L', addPos(d.mPos, d.shift, 3)].join('')
        })
        .style({stroke: function(d){
          return d.mPos[0] < job.fPos[0] ? 'url(#linear-mf)' : 'url(#linear-fm)' } })
        .style('stroke-width', function(d){ return d.matchFMTotal == maxTotal ? 10 : 3  })

    connectionG.dataAppend(mmLines, 'path.connection.mm')
        .attr('d', function(d){
          return ['M', addPos(job.mPos, job.shift), 'L', addPos(d.mPos, d.shift, 3)].join('')
        })
        .style({stroke: mColor})
        .style('stroke-width', function(d){ return d.matchMMTotal == maxTotal ? 10 : 3  })

    connectionG.dataAppend(ffLines, 'path.connection.ff')
        .attr('d', function(d){
          return ['M', addPos(job.fPos, job.shift), 'L', addPos(d.fPos, d.shift, -3)].join('')
        })
        .style({stroke: fColor})
        .style('stroke-width', function(d){ return d.matchFFTotal == maxTotal ? 10 : 3  })

    // connectionG.selectAll('path.connection')
    //     .attr('d', function(d){
    //       var path = d3.select(this).attr('df')
    //       return path.split('L')[0] + 'L' + path.split('L')[0].replace('M', '')
    //     })
    //   .transition()
    //     .attr('d', function(d){ return d3.select(this).attr('df') })

    if (mfLines.concat(fmLines).some(function(d){ return d.occupation == job.occupation })){

      var fmCircle = connectionG.append('path.connection')
          .attr('d', ['M', addPos(job.mPos, job.shift), 'A', 60, 60, 0, 1, 1, addPos(job.fPos, job.shift)].join(' '))
          .style('stroke', 'url(#circle-fm)')
          .style('stroke-width', Math.max(job.matchMFTotal, job.matchFMTotal) == maxTotal ? 10 : 3 )
      animatePathDash(fmCircle)
    }

    if (ffLines[0] == job){
      var ffCircle = connectionG.append('path.connection')
          .attr('d', ['M', addPos(job.fPos, job.shift, 1), 'A', 60, 60, 0, 1, 0, addPos(job.fPos, job.shift)].join(' '))
          .style('stroke', fColor)
          .style('stroke-width', job.matchFFTotal == maxTotal ? 6 : 3 )
      animatePathDash(ffCircle)
    }
    if (mmLines[0] == job){
      var mmCircle = connectionG.append('path.connection')
          .attr('d', ['M', addPos(job.mPos, job.shift, -1), 'A', 60, 60, 0, 1, 0, addPos(job.mPos, job.shift)].join(' '))
          .style('stroke', mColor)
          .style('stroke-width', job.matchFFTotal == maxTotal ? 6 : 3 )
      animatePathDash(mmCircle)
    }

    allHighlights.forEach(function(d){
      d.sel.style({'margin-left': d.shift[0] + 'px', 'margin-top': d.shift[1] + 'px'})
    })
  }


  function animatePathDash(path){
    var totalLength = path.node().getTotalLength();
     path
       .attr("stroke-dasharray", totalLength + " " + totalLength)
       .attr("stroke-dashoffset", totalLength)
       .transition()
         .duration(300)
         .ease("linear")
         .attr("stroke-dashoffset", 0);
  }

  //Typeahead
  var jobStrings = jobs.map(ƒ('soccupation'))
  function typeAheadFilter(str, cb){
    var regex = new RegExp(str, 'i');
    matches = jobStrings.filter(function(d){ return regex.test(d) })
    cb(matches)
  }

  var typeAheadConfig = {hint: true, highlight: true, minLength: 1}
  $('#typeahead')
      .typeahead(typeAheadConfig, {source: typeAheadFilter})
      .on('typeahead:change typeahead:close', function(){
        match = _.findWhere(jobs, {soccupation: $('#typeahead').val()})
        if (match) highlightJob(match)
        if (match) highlightMobile(match)
      })


  var firstMobile = true
  function highlightMobile(job){
    var match = null
    d3.selectAll('#mobile > div').each(function(d){
      if (d == job) match = this
    })
    if (match){
      return $('html, body').animate({
        scrollTop: $(match).offset().top
      }, 500)
    }


    // mfLines = _.sortBy(jobs, 'matchMFTotal').reverse().slice(0, 3)
    // fmLines = _.sortBy(jobs, 'matchFMTotal').reverse().slice(0, 3)
    // ffLines = _.sortBy(jobs, 'matchMMTotal').reverse().slice(0, 3)
    // mmLines = _.sortBy(jobs, 'matchFFTotal').reverse().slice(0, 3)


    var div = d3.select('#mobile').append('div.job').datum(job)

    div.append('div.selected-job').text('Female ' + job.soccupation + ' partner with ')

    var flist = div.append('div.f-list.jobs')
    flist.dataAppend(fmLines, 'span.male')
    flist.dataAppend(ffLines, 'span.female')

    flist.selectAll('span')
        .text(ƒ('soccupation'))


    div.append('div.selected-job').text('Male ' + job.soccupation + ' partner with ')

    var mlist = div.append('div.m-list.jobs')
    mlist.dataAppend(mfLines, 'span.female')
    mlist.dataAppend(mmLines, 'span.male')

    mlist.selectAll('span')
        .text(ƒ('soccupation'))


    div.selectAll('.jobs span').on('click', highlightJob)


    if (firstMobile) return firstMobile = false
    d3.select(document.documentElement)
        .interrupt()
      .transition()
        .duration(500)
        .tween("scroll", function() {
          var i = d3.interpolateNumber(pageYOffset, pageYOffset + div.node().getBoundingClientRect().top)
          return function(t) { scrollTo(0, i(t)) }
        })


    // $('html, body').animate({
    //   scrollTop: $(div.node()).offset().top
    // }, 500)

  }

  if (isMobile) highlightJob(_.findWhere(jobs, {soccupation: "Physicians and Surgeons"}))

  d3.selectAll('.highlight').on('mouseover click touchend', function(){
    highlightJob(_.findWhere(jobs, {soccupation: d3.select(this).attr('data-job')}))
  })

})


function addPos(a, b, c){
  if (c) return [a[0] + b[0] + c, a[1] + b[1] + 3];

  return [a[0] + b[0], a[1] + b[1]]
}


function vecDif(a, b){
  return [a[0] - b[0], a[1] - b[1]]
}

function dist(dif){
  return Math.sqrt(dif[0]*dif[0] + dif[1]*dif)
}