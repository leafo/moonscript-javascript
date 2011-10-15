-- repeat function n times
rep = (n, fn)->
  for i=1,n do fn!

my_obj = {
  value: 100
  show: =>
    print "My value is: " , @value
    @value += 1
}

my_obj\show!

print "calling bound function:"
bound = my_obj\show
rep 5, bound

